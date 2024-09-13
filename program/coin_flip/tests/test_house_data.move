#[test_only]
module coin_flip::test_house_data {
    use sui::test_scenario;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use coin_flip::ticket::{Self, Ticket};
    use coin_flip::house_data::{Self, HouseCap, HouseData};
    use coin_flip::game::{ Self };

    // Test data.
    const HOUSER: address = @0xFEED;
    const PLAYER: address = @0xBEEF;
    const INITIAL_HOUSER_BALANCE: u64 = 1_000_000_000;
    const INITIAL_PLAYER_BALANCE: u64 = 1_000_000_000;
    const MIN_STAKE_BALANCE: u64 = 10_000_000;
    const PUBLIC_KEY: vector<u8> = vector<u8> [
        134, 225,   1, 158, 217, 213,  32,  70, 180,
        42, 251, 131,  44, 112, 114, 117, 186,  65,
        90, 223, 233, 110,  24, 254, 105, 205, 219,
        236,  49, 113,  59, 167, 137,  19, 119,  39,
        75, 146, 197, 214,  70, 164, 176, 221,  55,
        218,  63, 198
    ];
    // Signed ticket id 0x... + starting count = 0000000000000000 (represented as u64) with house's private key.
    const BLS_SIG: vector<u8> = vector<u8>[
        136, 154,   7, 173,  12,  37,  13,  33, 154,  16, 189, 218,
        133,  39, 103,  67, 231, 161, 180, 182,  59, 227, 242, 213,
        91, 110,  13, 152, 200,   6,  24, 209,  49, 121, 110, 130,
        243, 251, 142, 221,  90,  45, 109,   2, 109,  44, 180, 110,
        22,  22,   0,  72,  86, 201, 109, 197,  43, 253, 177,  74,
        98, 233, 112, 120, 171, 188, 107,  94,  21,   9,  66, 248,
        190, 130, 117, 137, 118, 234, 205,  44,   1, 109, 251, 198,
        162, 219, 188,  29, 128, 225,  75, 193, 205,   0, 180, 145
    ];

    // Test errors.
    const EWrongMaxStake: u64 = 0;
    const EWrongMinStake: u64 = 1;
    const EWrongBaseFeeInBp: u64 = 2;
    const EWrongBalanceAfterInitialze: u64 = 3;
    const EWrongBalanceAfterTopup: u64 = 4;
    const EWrongBalanceAfterWithdraw: u64 = 5;
    const EWrongMinStakeAfterUpdate: u64 = 6;
    const EWrongMaxStakeAfterUpdate: u64 = 7;
    const EWrongBalanceAfterClaimFees: u64 = 8;

    #[test]
    fun initializes_house_data() {
        let mut scenario = test_scenario::begin(HOUSER);

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser coin.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            transfer::public_transfer(coin, HOUSER);
        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(
                house_data.balance() == INITIAL_HOUSER_BALANCE,
                EWrongBalanceAfterInitialze
            );
            assert!(
                house_data.min_stake() == 10_000_000,
                EWrongMinStake
            );
            assert!(
                house_data.max_stake() == 100_000_000_000,
                EWrongMaxStake
            );
            assert!(
                house_data.base_fee_in_bp() == 100,
                EWrongBaseFeeInBp
            );
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun top_up() {
        let mut scenario = test_scenario::begin(HOUSER);

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser coins.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            let fund_coin = coin::mint_for_testing<SUI>(MIN_STAKE_BALANCE, ctx);
            transfer::public_transfer(coin, HOUSER);
            transfer::public_transfer(fund_coin, HOUSER);
        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Top up the house data.
        scenario.next_tx(HOUSER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let owned_fund_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data.top_up(owned_fund_coin, ctx);
            test_scenario::return_shared(house_data);
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(
                house_data.balance() == INITIAL_HOUSER_BALANCE + MIN_STAKE_BALANCE,
                EWrongBalanceAfterTopup
            );
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun withdraw() {
        let mut scenario = test_scenario::begin(HOUSER);

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser coin.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            transfer::public_transfer(coin, HOUSER);
        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Withdraw the house data.
        scenario.next_tx(HOUSER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            house_data.withdraw(ctx);
            test_scenario::return_shared(house_data);
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(
                house_data.balance() == 0,
                EWrongBalanceAfterWithdraw
            );

            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun claim_fees() {
        let mut scenario = test_scenario::begin(HOUSER);
        let house_wins = false; // else player wins

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser and player coins.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let houser_coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            let player_coin = coin::mint_for_testing<SUI>(INITIAL_PLAYER_BALANCE, ctx);
            transfer::public_transfer(houser_coin, HOUSER);
            transfer::public_transfer(player_coin, PLAYER);

        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Prepare the game.
        scenario.next_tx(PLAYER);
        {
            let ctx = scenario.ctx();
            ticket::mint(ctx);
        };

        // Start a game.
        scenario.next_tx(PLAYER);
        let mut player_coin = scenario.take_from_sender<Coin<SUI>>();
        let player_ticket = scenario.take_from_sender<Ticket>();
        let mut house_data = scenario.take_shared<HouseData>();
        let ctx = scenario.ctx();
        let player_stake_coin = player_coin.split(MIN_STAKE_BALANCE, ctx);
        let game_id = game::start_game(
            &mut house_data,
            &player_ticket,
            player_stake_coin,
            ctx
        );

        scenario.return_to_sender(player_coin);
        scenario.return_to_sender(player_ticket);
        test_scenario::return_shared(house_data);

        // Start a guess.
        scenario.next_tx(PLAYER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let mut player_counter = scenario.take_from_sender<Ticket>();
            let ctx = scenario.ctx();
            game::start_guess(
                &mut house_data,
                &mut player_counter,
                game_id,
                house_wins,
                ctx
            );
            scenario.return_to_sender(player_counter);
            test_scenario::return_shared(house_data);
        };

        // End a game.
        scenario.next_tx(PLAYER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            game::end_game(
                &mut house_data,
                game_id,
                BLS_SIG,
                ctx
            );
            test_scenario::return_shared(house_data);
        };

        // Claim the house data fees.
        scenario.next_tx(HOUSER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            house_data.claim_fees(ctx);
            test_scenario::return_shared(house_data);
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            let hoser_coin = scenario.take_from_sender<Coin<SUI>>();
            let except_house_fees = MIN_STAKE_BALANCE * (house_data.base_fee_in_bp() as u64)
                / 10_000;
            assert!(
                house_data.fees() == 0,
                EWrongBalanceAfterClaimFees
            );
            assert!(
                hoser_coin.value() == except_house_fees,
                EWrongBalanceAfterClaimFees
            );
            scenario.return_to_sender(hoser_coin);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun update_min_stake() {
        let mut scenario = test_scenario::begin(HOUSER);

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser coin.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            transfer::public_transfer(coin, HOUSER);
        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Update the min stake.
        scenario.next_tx(HOUSER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            let new_min_stake = house_data.min_stake() * 2;
            house_data.update_min_stake(new_min_stake, ctx);
            test_scenario::return_shared(house_data);
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(
                house_data.min_stake() == 10_000_000 * 2,
                EWrongMinStakeAfterUpdate
            );

            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun update_max_stake() {
        let mut scenario = test_scenario::begin(HOUSER);

        // init the house.
        {
            let ctx = scenario.ctx();
            house_data::init_for_testing(ctx);
        };

        // Initialize the houser coin.
        scenario.next_tx(HOUSER);
        {
            let ctx = scenario.ctx();
            let coin = coin::mint_for_testing<SUI>(INITIAL_HOUSER_BALANCE, ctx);
            transfer::public_transfer(coin, HOUSER);
        };

        // Initialize the house data.
        scenario.next_tx(HOUSER);
        {
            let house_cap = scenario.take_from_sender<HouseCap>();
            let houser_coin = scenario.take_from_sender<Coin<SUI>>();
            let ctx = scenario.ctx();
            house_data::initialize_house_data(
                house_cap,
                houser_coin,
                PUBLIC_KEY,
                ctx
            );
        };

        // Update the min stake.
        scenario.next_tx(HOUSER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            let new_max_stake = house_data.max_stake() / 2;
            house_data.update_max_stake(new_max_stake, ctx);
            test_scenario::return_shared(house_data);
        };

        // Check the house data.
        scenario.next_tx(HOUSER);
        {
            let house_data = scenario.take_shared<HouseData>();
            assert!(
                house_data.max_stake() == 100_000_000_000 / 2,
                EWrongMaxStakeAfterUpdate
            );

            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }
}
