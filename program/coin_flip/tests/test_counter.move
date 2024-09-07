#[test_only]
module coin_flip::test_counter {
    use sui::test_scenario;
    use coin_flip::counter::{Self, Counter};

    // Test data.
    const HOUSER: address = @0xFEED;

    // Test errors.
    const EInvalidCountOnNewCounter: u64 = 1;
    const EInvalidCountOnIncreasedCounter: u64 = 2;

    #[test]
    fun creates_counter() {
        let mut scenario = test_scenario::begin(HOUSER);

        // Mint a counter for HOUSER.
        {
            let ctx = scenario.ctx();
            let counter = counter::mint(ctx);
            counter.transfer_to_sender(ctx);
        };

        // Check that the initial count value is 0.
        scenario.next_tx(HOUSER);
        {
            let counter = scenario.take_from_sender<Counter>();
            assert!(counter.count() == 0, EInvalidCountOnNewCounter);
            scenario.return_to_sender(counter);
        };

        scenario.end();
    }

    #[test]
    fun increments_counter() {
        let mut scenario = test_scenario::begin(HOUSER);

        // Mint a counter for HOUSER.
        {
            let ctx = scenario.ctx();
            let counter = counter::mint(ctx);
            counter.transfer_to_sender(ctx);
        };

        // Increment it & check its value has increased.
        scenario.next_tx(HOUSER);
        {
            let mut counter = scenario.take_from_sender<Counter>();
            counter.get_vrf_input_and_increment();
            assert!(counter.count() == 1, EInvalidCountOnIncreasedCounter);
            scenario.return_to_sender(counter);
        };

        scenario.end();
    }

    #[test]
    fun burns_counter() {
        let mut scenario = test_scenario::begin(HOUSER);

        // Mint a counter for HOUSER.
        {
            let ctx = scenario.ctx();
            let counter = counter::mint(ctx);
            counter.transfer_to_sender(ctx);
        };

        // Burn the counter.
        scenario.next_tx(HOUSER);
        {
            let counter = scenario.take_from_sender<Counter>();
            counter.burn();
        };

        scenario.end();
    }

}