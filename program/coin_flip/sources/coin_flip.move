module coin_flip::coin_flip {
    use sui::random::{ Random };

    entry fun flip_coin(random: &Random, ctx: &mut TxContext): bool {
        let mut generator = random.new_generator(ctx);
        let random_seed = generator.generate_bool();
        random_seed
    }
}
