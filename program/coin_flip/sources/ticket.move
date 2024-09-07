
/// This module contains the Ticket struct and its associated functions.
/// The Ticket struct is used as a unique VRF input for each coin flip game.
/// The Ticket struct is a non-transferable object that can be incremented and burned.
module coin_flip::ticket {
    use sui::bcs::{Self};

    const ECallerNotPlayer: u64 = 1;

    /// Ticket object that is used as a unique VRF input for each coin flip game.
    public struct Ticket has key {
        id: UID,
        count: u64,
        player: address,
    }

    /// Deletes a ticket object.
    entry fun burn(self: Ticket, ctx: & TxContext) {
        assert!(ctx.sender() == self.player(), ECallerNotPlayer);

        let Ticket { id, count: _, player: _ } = self;
        object::delete(id);
    }

    /// Creates a new ticket object.
    public fun mint(ctx: &mut TxContext) {
        let ticket = Ticket {
            id: object::new(ctx),
            count: 0,
            player: ctx.sender(),
        };

        transfer::transfer(ticket, ctx.sender());
    }

    /// Calculates the Ticket ID + count and returns the appended result as a vector<u8>.
    /// Then it increases the count by 1 and returns the appended bytes.
    public fun get_vrf_input_and_increment(self: &mut Ticket): vector<u8> {
        let mut vrf_input = object::id_bytes(self);
        let count_to_bytes = bcs::to_bytes(&count(self));
        vrf_input.append(count_to_bytes);
        self.increment();
        vrf_input
    }

    // --------------- HouserData Accessors --------------- 

    /// Returns the address of the house.
    public fun player(self: &Ticket): address {
        self.player
    }

    /// Returns the current count of the ticket object.
    public fun count(self: &Ticket): u64 {
        self.count
    }

    // === Internal ===

    /// Internal function to increment the ticket by 1.
    fun increment(self: &mut Ticket) {
        self.count = self.count + 1;
    }
}