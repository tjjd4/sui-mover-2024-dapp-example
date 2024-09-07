module coin_flip::game {
    use sui::coin::{Self, Coin};
    use sui::balance::Balance;
    use sui::sui::SUI;
    use sui::dynamic_object_field;
    use sui::event::emit;
    use sui::bls12381::bls12381_min_pk_verify;
    use sui::hash::blake2b256;

    use coin_flip::counter::Counter;
    use coin_flip::house_data::HouseData;

    // Consts
    const FUNDS_SUBMITTED_STATE: u8 = 0;
    const GUESS_SUBMITTED_STATE: u8 = 1;
    const GAME_RETURN: u8 = 2;
    const PLAYER_WON_STATE: u8 = 3;
    const HOUSE_WON_STATE: u8 = 4;
    const CHALLENGED_STATE: u8 = 5;
    const EPOCHS_CANCEL_AFTER: u64 = 6;

    // Errors
    const EStakeTooLow: u64 = 0;
    const EStakeTooHigh: u64 = 1;
    const EInvalidBlsSig: u64 = 2;
    const EInsufficientHouseBalance: u64 = 3;
    const ECallerNotGamePlayer: u64 = 4;
    const EGameDoesNotExist: u64 = 5;
    const EGameInvalidState: u64 = 6;
    const EGameNotInGuessSubmittedState: u64 = 7;
    const EGameCanNotCancelYet: u64 = 8;

    public struct Game has key, store {
        id: UID,
        player: address,
        total_stake: Balance<SUI>, // Total stake of the player and house (equal to 2x player_stake).
        guess_epoch: Option<u64>,
        guess: Option<bool>,
        vrf_input: Option<vector<u8>>,
        fee_bp: u16,
        status: u8
    }

    /// Emitted when a new game has started.
    public struct StartGameEvent has copy, drop {
        game_id: ID,
        player: address,
        player_stake: u64,
        guess: bool,
        vrf_input: vector<u8>,
        fee_bp: u16
    }

    /// Emitted when a game has finished.
    public struct EndGameEvent has copy, drop {
        game_id: ID,
        status: u8
    }

    public fun start_game(house_data: &mut HouseData, coin: Coin<SUI>, ctx: &mut TxContext): ID {
        let (id, new_game) = create_game(house_data, coin, ctx);

        dynamic_object_field::add(house_data.borrow_mut(), id, new_game);
        id
    }

    public fun start_guess(house_data: &mut HouseData, counter: &mut Counter, game_id: ID, guess: bool, ctx: &mut TxContext) {
        // Get a mutable reference to the game object.
        let game_mut_ref = borrow_mut( house_data, game_id);

        // Ensure caller is the one that created the game.
        assert!(ctx.sender() == game_mut_ref.player, ECallerNotGamePlayer);

        // Ensure that the game is in a valid state.
        assert!(status(game_mut_ref) == FUNDS_SUBMITTED_STATE, EGameInvalidState);

         let vrf_input = counter.get_vrf_input_and_increment();
        game_mut_ref.guess.fill(guess);
        game_mut_ref.vrf_input.fill( vrf_input);
        game_mut_ref.guess_epoch.fill(ctx.epoch());

        game_mut_ref.status = GUESS_SUBMITTED_STATE;

        emit(StartGameEvent {
            game_id,
            player: player(game_mut_ref),
            player_stake: total_stake(game_mut_ref) / (GAME_RETURN as u64),
            guess,
            vrf_input: vrf_input,
            fee_bp: fee_in_bp(game_mut_ref)
        });
    }

    public fun end_game(house_data: &mut HouseData, game_id: ID, bls_sig: vector<u8>, ctx: &mut TxContext) {
        // Get a reference to the game object.
        let game_ref = borrow_game(house_data, game_id);

        // Ensure that the game is in the correct state
        assert!(game_ref.status == GUESS_SUBMITTED_STATE, EGameInvalidState);

        // Step 1: Check the BLS signature, if its invalid abort.
        let is_sig_valid = bls12381_min_pk_verify(&bls_sig, &house_data.public_key(), game_ref.vrf_input.borrow());
        assert!(is_sig_valid, EInvalidBlsSig);

        // Hash the beacon before taking the 1st byte.
        let hashed_beacon = blake2b256(&bls_sig);

        // Step 2: Determine winner.
        let first_byte = hashed_beacon[0];
        let game_guess = game_ref.guess.borrow();
        let flip_result = first_byte % 2 == 0;
        let player_won = game_guess == flip_result;

        // Step 3: Distribute funds based on result.
        let game_mut_ref = borrow_mut(house_data, game_id);
        let status = if (player_won) {
            // Calculate the fee
            let total_stake_amount = total_stake(game_mut_ref);
            let fee_amount = fee_amount(total_stake_amount, game_mut_ref.fee_bp);

            let total_stake_mut_ref = game_mut_ref.borrow_total_stake_mut();
            let fee_balance = total_stake_mut_ref.split(fee_amount);
            // Calculate the rewards.
            let total_stake = total_stake_mut_ref.withdraw_all();

            // Transfer the rewards to the player.
            transfer::public_transfer(total_stake.into_coin(ctx), game_mut_ref.player);
            // Transfer it to the house.
            house_data.borrow_fees_mut().join(fee_balance);

            PLAYER_WON_STATE
        } else {
            // No fees are taken.
            let total_stake_amount = total_stake(game_mut_ref);
            let total_stake_mut_ref = game_mut_ref.borrow_total_stake_mut();
            let total_stake = total_stake_mut_ref.split(total_stake_amount);
            house_data.borrow_balance_mut().join(total_stake);
            HOUSE_WON_STATE
        };

        // Emit the end game event.
        emit(EndGameEvent {
            game_id,
            status,
        });
    }

    public fun cancel_game(house_data: &mut HouseData, game_id: ID, ctx: &mut TxContext) {
        // Ensure that the game exists.
        assert!(game_exists(house_data, game_id), EGameDoesNotExist);

        let Game {
            id,
            guess_epoch,
            mut total_stake,
            guess: _,
            player,
            vrf_input: _,
            fee_bp: _,
            status
        } = dynamic_object_field::remove(house_data.borrow_mut(), game_id);

        object::delete(id);

        // Ensure that the game is in the correct state
        assert!(status == GUESS_SUBMITTED_STATE, EGameInvalidState);

        let current_epoch = ctx.epoch();
        let cancel_epoch = *guess_epoch.borrow() + EPOCHS_CANCEL_AFTER;

        // Ensure that minimum epochs have passed before user can cancel.
        assert!(cancel_epoch <= current_epoch, EGameCanNotCancelYet);

        // Return the player's stake.
        let player_amount = total_stake.value() / (GAME_RETURN as u64);
        let player_stake = total_stake.split(player_amount);
        transfer::public_transfer(player_stake.into_coin(ctx), player);
        house_data.borrow_balance_mut().join(total_stake);

        // Emit the end game event.
        emit(EndGameEvent {
            game_id,
            status: CHALLENGED_STATE,
        });
    }


    // --------------- HouseData Mutations ---------------

    /// Returns a mutable reference to the total_stake of the game.
    public(package) fun borrow_total_stake_mut(game: &mut Game): &mut Balance<SUI> {
        &mut game.total_stake
    }

    // --------------- Game Accessors ---------------

    /// Returns the player's address.
    public fun player(game: &Game): address {
        game.player
    }

    /// Returns the total stake.
    public fun total_stake(game: &Game): u64 {
        game.total_stake.value()
    }

    /// Returns the epoch in which the guess was placed.
    public fun guess_epoch(game: &Game): u64 {
        assert!(game.guess_epoch.is_some(), EGameNotInGuessSubmittedState);
        *game.guess_epoch.borrow()
    }

    /// Returns the player's guess.
    public fun guess(game: &Game): bool {
        assert!(game.guess.is_some(), EGameNotInGuessSubmittedState);
        *game.guess.borrow()
    }

    /// Returns the player's vrf_input bytes.
    public fun vrf_input(game: &Game): vector<u8> {
        assert!(game.vrf_input.is_some(), EGameNotInGuessSubmittedState);
        *game.vrf_input.borrow()
    }

    /// Returns the fee of the game.
    public fun fee_in_bp(game: &Game): u16 {
        game.fee_bp
    }
    /// Returns the status of the game.
    public fun status(game: &Game): u8 {
        game.status
    }

    // --------------- Public Helper Functions ---------------
    
    /// Calculate the amount of fees to be paid
    public fun fee_amount(total_stake: u64, fee_in_bp: u16): u64 {
        (((total_stake / (GAME_RETURN as u64)) as u128) * (fee_in_bp as u128) / 10_000) as u64
    }

    /// To check if a game exists.
    public fun game_exists(house_data: &HouseData, game_id: ID): bool {
        dynamic_object_field::exists_(house_data.borrow(), game_id)
    }

    /// To check that a game exists and return a reference to the game Object.
    public fun borrow_game(house_data: &HouseData, game_id: ID): &Game {
        assert!(game_exists(house_data, game_id), EGameDoesNotExist);
        dynamic_object_field::borrow(house_data.borrow(), game_id)
    }

    // --------------- Internal Helper Functions ---------------

    /// To create a new game.
    fun create_game(house_data: &mut HouseData, coin: Coin<SUI>, ctx: &mut TxContext): (ID, Game) {
        let base_fee_in_bp = house_data.base_fee_in_bp();
        let player_stake = coin.value();
        // Ensure that the stake is not lower than the min stake.
        assert!(player_stake >= house_data.min_stake(), EStakeTooLow);
        // Ensure that the stake is not higher than the max stake.
        assert!(player_stake <= house_data.max_stake(), EStakeTooHigh);
        // Ensure that the house has enough balance to play for this game.
        assert!(house_data.balance() >= player_stake, EInsufficientHouseBalance);
        
        // Extract an equal amount of player stake from the house data as wagered funds.
        let mut total_stake = house_data.borrow_balance_mut().split(player_stake);
        coin::put(&mut total_stake, coin);

        let id = object::new(ctx);
        let new_game = Game {
            id,
            player: ctx.sender(),
            total_stake,
            guess_epoch: option::none(),
            guess: option::none(),
            vrf_input: option::none(),
            fee_bp: base_fee_in_bp,
            status: FUNDS_SUBMITTED_STATE,
        };

        (object::id(&new_game), new_game)
    }

    /// To check that a game exists and return a mutable reference to the game Object.
    fun borrow_mut(house_data: &mut HouseData, game_id: ID): &mut Game {
        assert!(game_exists(house_data, game_id), EGameDoesNotExist);
        dynamic_object_field::borrow_mut(house_data.borrow_mut(), game_id)
    }
}
