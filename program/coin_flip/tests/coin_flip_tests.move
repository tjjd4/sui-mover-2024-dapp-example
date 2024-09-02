#[test_only]
module coin_flip::coin_flip_tests {
    use sui::random::{Self, Random};
    use coin_flip::{ coin_flip };
    use sui::test_scenario;
    use std::debug;

    // const ENotImplemented: u64 = 0;

    #[test]
    fun test_coin_flip() {
        let user = @0x0;
        let mut test_scenario = test_scenario::begin(user);
        
        random::create_for_testing(test_scenario.ctx());
        test_scenario.next_tx(user);

        let mut random_state: Random = test_scenario.take_shared();
        random_state.update_randomness_state_for_testing(
            0,
            x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F",
            test_scenario.ctx(),
        );
        let result = coin_flip::flip_coin(&random_state, test_scenario.ctx());
        debug::print(&result);
        test_scenario::return_shared(random_state);
        test_scenario.end();
    }

    // #[test, expected_failure(abort_code = ::coin_flip::coin_flip_tests::ENotImplemented)]
    // fun test_coin_flip_fail() {
    //     abort ENotImplemented
    // }
}
