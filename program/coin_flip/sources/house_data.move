
/// This module contains the HouseData struct and its associated functions.
/// The HouseData struct is used to store the infomation of game restrictions and fees.
module coin_flip::house_data {
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::package::{Self};

    const HOUSE_MIN_STAKE: u64 = 10_000_000; // 0.01 SUI
    const HOUSE_MAX_STAKE: u64 = 100_000_000_000; // 100 SUI
    const HOUSE_BASE_FEE_IN_BP: u16 = 100; // 1% in basis points

    /// Error codes
    const EInsufficientBalance: u64 = 0;
    const ECallerNotHouser: u64 = 1;

    /// Configuration and Treasury object, managed by the house.
    public struct HouseData has key {
        id: UID,
        houser: address,
        public_key: vector<u8>,
        balance: Balance<SUI>,
        fees: Balance<SUI>,
        min_stake: u64,
        max_stake: u64,
        base_fee_in_bp: u16,
    }

    public struct HouseCap has key {
        id: UID,
    }

    /// Used as a one time witness to generate the publisher.
    public struct HOUSE_DATA has drop {}

    fun init(otw: HOUSE_DATA, ctx: &mut TxContext) {
        // Creating and sending the Publisher object to the sender.
        package::claim_and_keep(otw, ctx);

        // Creating and sending the HouseCap object to the sender.
        let house_cap = HouseCap {
            id: object::new(ctx),
        };

        transfer::transfer(house_cap, ctx.sender());
    }

    /// Initializer function that should only be called once and by the creator of the contract.
    public fun initialize_house_data(house_cap: HouseCap, coin: Coin<SUI>, public_key: vector<u8>, ctx: &mut TxContext) {
        assert!(coin.value() > 0, EInsufficientBalance);

        let house_data = HouseData {
            id: object::new(ctx),
            houser: ctx.sender(),
            public_key,
            balance: coin.into_balance(),
            fees: balance::zero(),
            min_stake: HOUSE_MIN_STAKE,
            max_stake: HOUSE_MAX_STAKE,
            base_fee_in_bp: HOUSE_BASE_FEE_IN_BP,
        };
        
        let HouseCap { id } = house_cap;
        object::delete(id);

        transfer::share_object(house_data);
    }

    /// Top up the house balance.
    public fun top_up(house_data: &mut HouseData, coin: Coin<SUI>, _: &mut TxContext) {
        coin::put(&mut house_data.balance, coin)
    }

    /// Withdraw the house balance.
    public fun withdraw(house_data: &mut HouseData, ctx: &mut TxContext) {
        // Only the houser address can withdraw funds.
        assert!(ctx.sender() == house_data.houser(), ECallerNotHouser);
        
        let total_balance = balance(house_data);
        let coin = coin::take(&mut house_data.balance, total_balance, ctx);
        transfer::public_transfer(coin, house_data.houser());
    }

    /// Claim the house accumulated fees.
    public fun claim_fees(house_data: &mut HouseData, ctx: &mut TxContext) {
        // Only the houser address can claim fees.
        assert!(ctx.sender() == house_data.houser(), ECallerNotHouser);

        let total_fees = fees(house_data);
        let coin = coin::take(&mut house_data.fees, total_fees, ctx);
        transfer::public_transfer(coin, house_data.houser());
    }

    /// Update the min stake of the house.
    public fun update_min_stake(house_data: &mut HouseData, min_stake: u64, ctx: &mut TxContext) {
        // Only the houser address can update the min stake.
        assert!(ctx.sender() == house_data.houser(), ECallerNotHouser);

        house_data.min_stake = min_stake;
    }

    /// Update the max stake of the house.
    public fun update_max_stake(house_data: &mut HouseData, max_stake: u64, ctx: &mut TxContext) {
        // Only the houser address can update the max stake.
        assert!(ctx.sender() == house_data.houser(), ECallerNotHouser);

        house_data.max_stake = max_stake;
    }

    // --------------- HouseData Mutations ---------------

    /// Returns a mutable reference to the balance of the house.
    public(package) fun borrow_balance_mut(house_data: &mut HouseData): &mut Balance<SUI> {
        &mut house_data.balance
    }

    /// Returns a mutable reference to the fees of the house.
    public(package) fun borrow_fees_mut(house_data: &mut HouseData): &mut Balance<SUI> {
        &mut house_data.fees
    }

    /// Returns a mutable reference to the house id.
    public(package) fun borrow_mut(house_data: &mut HouseData): &mut UID {
        &mut house_data.id
    }

    // --------------- HouserData Accessors ---------------

    /// Returns a reference to the house id.
    public(package) fun borrow(house_data: &HouseData): &UID {
        &house_data.id
    }

    /// Returns the address of the house.
    public fun houser(house_data: &HouseData): address {
        house_data.houser
    }

    /// Returns the public key of the house.
    public fun public_key(house_data: &HouseData): vector<u8> {
        house_data.public_key
    }

    /// Returns the balance of the house.
    public fun balance(house_data: &HouseData): u64 {
        house_data.balance.value()
    }

    /// Returns the fees of the house.
    public fun fees(house_data: &HouseData): u64 {
        house_data.fees.value()
    }

    /// Returns the min stake of the house.
    public fun min_stake(house_data: &HouseData): u64 {
        house_data.min_stake
    }

    /// Returns the max stake of the house.
    public fun max_stake(house_data: &HouseData): u64 {
        house_data.max_stake
    }

    /// Returns the base fee.
    public fun base_fee_in_bp(house_data: &HouseData): u16 {
        house_data.base_fee_in_bp
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(HOUSE_DATA {}, ctx);
    }
}