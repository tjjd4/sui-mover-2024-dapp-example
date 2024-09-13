#[test_only]
module coin_flip::test_game {
    use sui::test_scenario;
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use coin_flip::ticket::{Self, Ticket};
    use coin_flip::house_data::{Self, HouseData, HouseCap};
    use coin_flip::game::{ Self };

    // use std::debug;

    // Test data.
    const HOUSER: address = @0xFEED;
    const PLAYER: address = @0xBEEF;
    const INITIAL_HOUSER_BALANCE: u64 = 1_000_000_000;
    const INITIAL_PLAYER_BALANCE: u64 = 1_000_000_000;
    const MIN_STAKE_BALANCE: u64 = 10_000_000;
    const PUBLIC_KEY: vector<u8> = vector<u8>[
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
    const EWrongPlayerBalanceAfterLoss: u64 = 0;
    // const EWrongPlayerBalanceAfterWin: u64 = 1;
    const EWrongHouseBalanceAfterWin: u64 = 2;
    // const EWrongHouseBalanceAfterLoss: u64 = 3;

    #[test]
    fun wins_game() {
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
        // debug::print(&b"player coin: ".to_string());
        // debug::print(&player_coin.value());
        // debug::print(&b"House balance: ".to_string());
        // debug::print(&house_data.balance());
        scenario.return_to_sender(player_coin);
        scenario.return_to_sender(player_ticket);
        test_scenario::return_shared(house_data);

        // Check that the game is in funds sumbitted state.
        // scenario.next_tx(PLAYER);
        // {
        //     let house_data = scenario.take_shared<HouseData>();
        //     let game = game::borrow_game(&house_data, game_id);
        //     debug::print(&b"Game status: ".to_string());
        //     debug::print(&game.status());
        //     debug::print(&b"Game total stake: ".to_string());
        //     debug::print(&game.total_stake());
        //     test_scenario::return_shared(house_data);
        // };

        // Start a guess.
        scenario.next_tx(PLAYER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let mut player_ticket = scenario.take_from_sender<Ticket>();
            let ctx = scenario.ctx();
            game::start_guess(
                &mut house_data,
                &mut player_ticket,
                game_id,
                house_wins,
                ctx
            );
            scenario.return_to_sender(player_ticket);
            test_scenario::return_shared(house_data);
        };

        // Check that the game is in guess sumbitted state.
        // scenario.next_tx(PLAYER);
        // {
        //     let house_data = scenario.take_shared<HouseData>();
        //     let game = game::borrow_game(&house_data, game_id);
        //     debug::print(&b"Game: ".to_string());
        //     debug::print(game);
        //     test_scenario::return_shared(house_data);
        // };

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

        // Check balances.
        scenario.next_tx(PLAYER);
        {
            let house_data = scenario.take_shared<HouseData>();
            let mut player_coin = scenario.take_from_sender<Coin<SUI>>();
            // debug::print(&b"House balance: ".to_string());
            // debug::print(&house_data.balance());
            // debug::print(&b"House fees: ".to_string());
            // debug::print(&house_data.fees());
            // debug::print(&b"player coin: ".to_string());
            // debug::print(&player_coin.value());
            // Ensure house has correct balance.
            if (house_wins) {
                let expected_house_balance = INITIAL_HOUSER_BALANCE + MIN_STAKE_BALANCE;
                let expected_player_balance = INITIAL_PLAYER_BALANCE - MIN_STAKE_BALANCE;
                // debug::print(
                //     &b"expected house balance:: ".to_string()
                // );
                // debug::print(
                //     &(expected_house_balance).to_string()
                // );
                // debug::print(
                //     &b"expected player balance:: ".to_string()
                // );
                // debug::print(
                //     &(expected_player_balance).to_string()
                // );
                assert!(
                    house_data.balance() == expected_house_balance,
                    EWrongHouseBalanceAfterWin
                );
                // Ensure player has correct balance.
                assert!(
                    player_coin.value() == expected_player_balance,
                    EWrongPlayerBalanceAfterLoss
                );
            } else {
                let second_player_coin = scenario.take_from_sender<Coin<SUI>>();
                player_coin.join(second_player_coin);
                let expected_house_balance = INITIAL_HOUSER_BALANCE - MIN_STAKE_BALANCE;
                let except_house_fees = MIN_STAKE_BALANCE * (
                    house_data.base_fee_in_bp() as u64
                ) / 10_000;
                let expected_player_balance = INITIAL_PLAYER_BALANCE + MIN_STAKE_BALANCE - except_house_fees;
                // debug::print(
                //     &b"expected house balance:: ".to_string()
                // );
                // debug::print(
                //     &(expected_house_balance).to_string()
                // );
                // debug::print(
                //     &b"expected house fees:: ".to_string()
                // );
                // debug::print(&(except_house_fees).to_string());
                // debug::print(
                //     &b"expected player balance:: ".to_string()
                // );
                // debug::print(
                //     &(expected_player_balance).to_string()
                // );
                assert!(
                    house_data.balance() == expected_house_balance,
                    EWrongHouseBalanceAfterWin
                );
                assert!(
                    house_data.fees() == except_house_fees,
                    EWrongHouseBalanceAfterWin
                );
                // Ensure player has correct balance.
                assert!(
                    player_coin.value() == expected_player_balance,
                    EWrongPlayerBalanceAfterLoss
                );
            };
            scenario.return_to_sender(player_coin);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }

    #[test]
    fun cancels_game() {
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
        // debug::print(&b"player coin: ".to_string());
        // debug::print(&player_coin.value());
        // debug::print(&b"House balance: ".to_string());
        // debug::print(&house_data.balance());
        scenario.return_to_sender(player_coin);
        scenario.return_to_sender(player_ticket);
        test_scenario::return_shared(house_data);

        // Check that the game is in funds sumbitted state.
        // scenario.next_tx(PLAYER);
        // {
        //     let house_data = scenario.take_shared<HouseData>();
        //     let game = game::borrow_game(&house_data, game_id);
        //     debug::print(&b"Game status: ".to_string());
        //     debug::print(&game.status());
        //     debug::print(&b"Game total stake: ".to_string());
        //     debug::print(&game.total_stake());
        //     test_scenario::return_shared(house_data);
        // };

        // Start a guess.
        scenario.next_tx(PLAYER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let mut player_ticket = scenario.take_from_sender<Ticket>();
            let ctx = scenario.ctx();
            game::start_guess(
                &mut house_data,
                &mut player_ticket,
                game_id,
                house_wins,
                ctx
            );
            scenario.return_to_sender(player_ticket);
            test_scenario::return_shared(house_data);
        };

        // Check that the game is in guess sumbitted state.
        // scenario.next_tx(PLAYER);
        // {
        //     let house_data = scenario.take_shared<HouseData>();
        //     let game = game::borrow_game(&house_data, game_id);
        //     debug::print(&b"Game: ".to_string());
        //     debug::print(game);
        //     test_scenario::return_shared(house_data);
        // };

        // Simulate epoch passage.
        scenario.next_tx(PLAYER);
        {
            let mut i = 0 ;
            while(i < 7) {
                scenario.next_epoch(PLAYER);
                i = i + 1;
            }
        };

        // Cancel a game.
        scenario.next_tx(PLAYER);
        {
            let mut house_data = scenario.take_shared<HouseData>();
            let ctx = scenario.ctx();
            game::cancel_game(
                &mut house_data,
                game_id,
                ctx
            );
            test_scenario::return_shared(house_data);
        };

        // Check balances
        scenario.next_tx(PLAYER);
        {
            let house_data = scenario.take_shared<HouseData>();
            let mut player_coin = scenario.take_from_sender<Coin<SUI>>();
            let second_player_coin = scenario.take_from_sender<Coin<SUI>>();
            player_coin.join(second_player_coin);
            // debug::print(&b"House balance: ".to_string());
            // debug::print(&house_data.balance());
            // debug::print(&b"player coin: ".to_string());
            // debug::print(&player_coin.value());
            // Ensure house has correct balance.
            let expected_house_balance = INITIAL_HOUSER_BALANCE;
            let expected_player_balance = INITIAL_PLAYER_BALANCE;
            // debug::print(
            //     &b"expected house balance:: ".to_string()
            // );
            // debug::print(
            //     &(expected_house_balance).to_string()
            // );
            // debug::print(
            //     &b"expected player balance:: ".to_string()
            // );
            // debug::print(
            //     &(expected_player_balance).to_string()
            // );
            assert!(
                house_data.balance() == expected_house_balance,
                EWrongHouseBalanceAfterWin
            );
            // Ensure player has correct balance.
            assert!(
                player_coin.value() == expected_player_balance,
                EWrongPlayerBalanceAfterLoss
            );
            
            scenario.return_to_sender(player_coin);
            test_scenario::return_shared(house_data);
        };

        scenario.end();
    }
}
