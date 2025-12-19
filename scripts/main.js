import { world, system, BlockVolume } from "@minecraft/server";

// List of solid block types to choose from
const BLOCK_OPTIONS = [
  "minecraft:stone",
  "minecraft:granite",
  "minecraft:polished_granite",
  "minecraft:diorite",
  "minecraft:polished_diorite",
  "minecraft:andesite",
  "minecraft:polished_andesite",
  "minecraft:deepslate",
  "minecraft:cobbled_deepslate",
  "minecraft:polished_deepslate",
  "minecraft:calcite",
  "minecraft:tuff",
  "minecraft:dripstone_block",
  "minecraft:coal_block",
  "minecraft:copper_block",
  "minecraft:cut_copper",
  "minecraft:exposed_copper",
  "minecraft:weathered_copper",
  "minecraft:oxidized_copper",
  "minecraft:iron_block",
  "minecraft:gold_block",
  "minecraft:redstone_block",
  "minecraft:lapis_block",
  "minecraft:emerald_block",
  "minecraft:diamond_block",
  "minecraft:netherite_block",
  "minecraft:oak_planks",
  "minecraft:spruce_planks",
  "minecraft:birch_planks",
  "minecraft:jungle_planks",
  "minecraft:acacia_planks",
  "minecraft:dark_oak_planks",
  "minecraft:mangrove_planks",
  "minecraft:cherry_planks",
  "minecraft:bamboo_planks",
  "minecraft:bamboo_mosaic",
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log",
  "minecraft:bricks",
  "minecraft:stone_bricks",
  "minecraft:mossy_stone_bricks",
  "minecraft:cracked_stone_bricks",
  "minecraft:chiseled_stone_bricks",
  "minecraft:deepslate_bricks",
  "minecraft:deepslate_tiles",
  "minecraft:nether_bricks",
  "minecraft:red_nether_bricks",
  "minecraft:polished_blackstone_bricks",
  "minecraft:end_stone_bricks",
  "minecraft:sandstone",
  "minecraft:cut_sandstone",
  "minecraft:smooth_sandstone",
  "minecraft:red_sandstone",
  "minecraft:cut_red_sandstone",
  "minecraft:smooth_red_sandstone",
  "minecraft:terracotta",
  "minecraft:white_concrete",
  "minecraft:orange_concrete",
  "minecraft:magenta_concrete",
  "minecraft:light_blue_concrete",
  "minecraft:yellow_concrete",
  "minecraft:lime_concrete",
  "minecraft:pink_concrete",
  "minecraft:gray_concrete",
  "minecraft:light_gray_concrete",
  "minecraft:cyan_concrete",
  "minecraft:purple_concrete",
  "minecraft:blue_concrete",
  "minecraft:brown_concrete",
  "minecraft:green_concrete",
  "minecraft:red_concrete",
  "minecraft:black_concrete",
  "minecraft:end_stone",
  "minecraft:obsidian",
  "minecraft:crying_obsidian",
  "minecraft:blackstone",
  "minecraft:polished_blackstone",
  "minecraft:basalt",
  "minecraft:smooth_basalt",
  "minecraft:quartz_block",
  "minecraft:chiseled_quartz_block",
  "minecraft:smooth_quartz",
  "minecraft:ice",
  "minecraft:packed_ice",
  "minecraft:blue_ice",
  "minecraft:slime_block",
  "minecraft:honey_block",
  "minecraft:amethyst_block",
  "minecraft:budding_amethyst",
  "minecraft:calcite",
  "minecraft:bookshelf",
  "minecraft:glowstone",
  "minecraft:sea_lantern",
  "minecraft:shroomlight",
  "minecraft:purpur_block",
  "minecraft:purpur_pillar",
  "minecraft:prismarine",
  "minecraft:prismarine_bricks",
  "minecraft:dark_prismarine",
"minecraft:cobblestone",
"minecraft:mossy_cobblestone",
"minecraft:stone_tiles",
"minecraft:chiseled_deepslate",
"minecraft:reinforced_deepslate",
"minecraft:stripped_oak_log",
"minecraft:stripped_spruce_log",
"minecraft:stripped_birch_log",
"minecraft:stripped_jungle_log",
"minecraft:stripped_acacia_log",
"minecraft:stripped_dark_oak_log",
"minecraft:stripped_mangrove_log",
"minecraft:stripped_cherry_log",
"minecraft:white_terracotta",
"minecraft:orange_terracotta",
"minecraft:magenta_terracotta",
"minecraft:light_blue_terracotta",
"minecraft:yellow_terracotta",
"minecraft:lime_terracotta",
"minecraft:pink_terracotta",
"minecraft:gray_terracotta",
"minecraft:light_gray_terracotta",
"minecraft:cyan_terracotta",
"minecraft:purple_terracotta",
"minecraft:blue_terracotta",
"minecraft:brown_terracotta",
"minecraft:green_terracotta",
"minecraft:red_terracotta",
"minecraft:black_terracotta",
"minecraft:glass",
"minecraft:white_stained_glass",
"minecraft:orange_stained_glass",
"minecraft:magenta_stained_glass",
"minecraft:light_blue_stained_glass",
"minecraft:yellow_stained_glass",
"minecraft:lime_stained_glass",
"minecraft:pink_stained_glass",
"minecraft:gray_stained_glass",
"minecraft:light_gray_stained_glass",
"minecraft:cyan_stained_glass",
"minecraft:purple_stained_glass",
"minecraft:blue_stained_glass",
"minecraft:brown_stained_glass",
"minecraft:green_stained_glass",
"minecraft:red_stained_glass",
"minecraft:black_stained_glass",
"minecraft:moss_block",
"minecraft:clay",
"minecraft:packed_mud",
"minecraft:mud_bricks",
"minecraft:end_stone",
"minecraft:ancient_debris",
"minecraft:gilded_blackstone",
"minecraft:polished_blackstone",
"minecraft:polished_blackstone_tiles",
"minecraft:cut_copper",
"minecraft:exposed_cut_copper",
"minecraft:weathered_cut_copper",
"minecraft:oxidized_cut_copper"
];


// Track last chunk per player
const lastChunkByPlayer = new Map();

// Track chunks that have already been generated
const generatedChunks = new Set();

// Deterministic block per chunk
function getBlockForChunk(chunkX, chunkZ) {
  let seed = (chunkX * 73856093) ^ (chunkZ * 19349663);
  if (seed < 0) seed = ~seed;
  return BLOCK_OPTIONS[seed % BLOCK_OPTIONS.length];
}

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

// Fill chunk from Y=0 to just below player feet
function fillChunk(chunkX, chunkZ, blockId, playerY) {
  const overworld = world.getDimension("overworld");

  const baseX = chunkX * 16;
  const baseZ = chunkZ * 16;

  // How deep below the player we replace blocks
  const DEPTH_BELOW_PLAYER = 80;

  // Calculate minimum Y once (big optimisation)
  const minY = Math.max(-64, Math.floor(playerY) - DEPTH_BELOW_PLAYER);

  for (let dx = 0; dx < 16; dx++) {
    for (let dz = 0; dz < 16; dz++) {
      const x = baseX + dx;
      const z = baseZ + dz;

      // Raycast down to find surface
      const hit = overworld.getBlockFromRay(
        { x, y: 320, z },
        { x: 0, y: -1, z: 0 },
        { maxDistance: 384 }
      );

      if (!hit) continue;

      const surfaceY = hit.block.location.y;

      // Replace solid blocks from minY → surfaceY
      for (let y = minY; y <= surfaceY; y++) {
        const block = overworld.getBlock({ x, y, z });
        if (!block) continue;

        // Skip air
        if (block.typeId === "minecraft:air") continue;

        // Skip bedrock (safety)
        if (block.typeId === "minecraft:bedrock") continue;

        // Force-replace leaves so trees don't cause pillars
        if (block.typeId.includes("_leaves")) {
          block.setType(blockId);
          continue;
        }

        // Replace everything else
        block.setType(blockId);
      }
    }
  }
}




function fillChunkNether(chunkX, chunkZ, blockId) {
  const nether = world.getDimension("nether");

  const baseX = chunkX * 16;
  const baseZ = chunkZ * 16;

  for (let dx = 0; dx < 16; dx++) {
    for (let dz = 0; dz < 16; dz++) {
      const x = baseX + dx;
      const z = baseZ + dz;

      for (let y = 0; y <= 127; y++) {
        const block = nether.getBlock({ x, y, z });
        if (!block) continue;

        // ❌ Skip air
        if (block.typeId === "minecraft:air") continue;

        // ❌ Skip spawners (blaze spawners in fortresses)
        if (block.typeId === "minecraft:mob_spawner") continue;

        // ✅ Replace everything else
        block.setType(blockId);
      }
    }
  }
}

// Check for chunk changes
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const pos = player.location;

    const chunkX = Math.floor(pos.x / 16);
    const chunkZ = Math.floor(pos.z / 16);
    const playerName = player.name;

    const lastChunk = lastChunkByPlayer.get(playerName);

    if (!lastChunk || lastChunk.x !== chunkX || lastChunk.z !== chunkZ) {
      lastChunkByPlayer.set(playerName, { x: chunkX, z: chunkZ });

      const key = chunkKey(chunkX, chunkZ);

      // Generate chunk ONCE only
      if (!generatedChunks.has(key)) {
        generatedChunks.add(key);

        const blockType = getBlockForChunk(chunkX, chunkZ);

        if (player.dimension.id === "minecraft:overworld") {
            fillChunk(chunkX, chunkZ, blockType, pos.y);
        } else if (player.dimension.id === "minecraft:nether") {
            fillChunkNether(chunkX, chunkZ, blockType);
        }
      }
    }
  }
}, 5);
