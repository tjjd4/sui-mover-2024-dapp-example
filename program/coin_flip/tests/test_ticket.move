#[test_only]
module coin_flip::test_ticket {
    use sui::test_scenario;
    use coin_flip::ticket::{Self, Ticket};

    // Test data.
    const PLAYER: address = @0xBEEF;

    // Test errors.
    const EInvalidCountOnNewCounter: u64 = 1;
    const EInvalidCountOnIncreasedCounter: u64 = 2;

    #[test]
    fun creates_counter() {
        let mut scenario = test_scenario::begin(PLAYER);

        // Mint a ticket.
        {
            let ctx = scenario.ctx();
            ticket::mint(ctx);
        };

        // Check that the initial count value is 0.
        scenario.next_tx(PLAYER);
        {
            let ticket = scenario.take_from_sender<Ticket>();
            assert!(ticket.count() == 0, EInvalidCountOnNewCounter);
            scenario.return_to_sender(ticket);
        };

        scenario.end();
    }

    #[test]
    fun increments_counter() {
        let mut scenario = test_scenario::begin(PLAYER);

        // Mint a ticket.
        {
            let ctx = scenario.ctx();
            ticket::mint(ctx);
        };

        // Increment it & check its value has increased.
        scenario.next_tx(PLAYER);
        {
            let mut ticket = scenario.take_from_sender<Ticket>();
            ticket.get_vrf_input_and_increment();
            assert!(ticket.count() == 1, EInvalidCountOnIncreasedCounter);
            scenario.return_to_sender(ticket);
        };

        scenario.end();
    }

    #[test]
    fun burns_counter() {
        let mut scenario = test_scenario::begin(PLAYER);

        // Mint a ticket.
        {
            let ctx = scenario.ctx();
            ticket::mint(ctx);
        };

        // Burn the ticket.
        scenario.next_tx(PLAYER);
        {
            let ticket = scenario.take_from_sender<Ticket>();
            let ctx = scenario.ctx();
            ticket.burn(ctx);
        };

        scenario.end();
    }

}