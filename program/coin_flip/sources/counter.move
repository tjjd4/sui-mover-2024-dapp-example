
/// This module contains the Counter struct and its associated functions.
/// The Counter struct is used as a unique VRF input for each coin flip game.
/// The Counter struct is a non-transferable object that can be incremented and burned.
module coin_flip::counter {
    use sui::bcs::{Self};

    /// Counter object that is used as a unique VRF input for each coin flip game.
    public struct Counter has key {
        id: UID,
        count: u64,
    }

    /// Deletes a counter object.
    entry fun burn(self: Counter) {
        let Counter { id, count: _ } = self;
        object::delete(id);
    }

    /// Creates a new counter object.
    public fun mint(ctx: &mut TxContext): Counter {
        Counter {
            id: object::new(ctx),
            count: 0
        }
    }

    /// Transfers a counter object to the sender.
    public fun transfer_to_sender(counter: Counter, ctx: &mut TxContext) {
        transfer::transfer(counter, ctx.sender());
    }

    /// Calculates the Counter ID + count and returns the appended result as a vector<u8>.
    /// Then it increases the count by 1 and returns the appended bytes.
    public fun get_vrf_input_and_increment(self: &mut Counter): vector<u8> {
        let mut vrf_input = object::id_bytes(self);
        let count_to_bytes = bcs::to_bytes(&count(self));
        vrf_input.append(count_to_bytes);
        self.increment();
        vrf_input
    }

    /// Returns the current count of the counter object.
    public fun count(self: &Counter): u64 {
        self.count
    }

    // === Internal ===

    /// Internal function to increment the counter by 1.
    fun increment(self: &mut Counter) {
        self.count = self.count + 1;
    }

    #[test_only]
    public fun burn_for_testing(self: Counter) {
        self.burn();
    }
}