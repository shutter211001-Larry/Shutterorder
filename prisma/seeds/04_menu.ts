import { PrismaClient } from '@prisma/client';

export async function seedMenu(prisma: PrismaClient) {
  console.log('Seeding Menu...');

  const location = await prisma.location.findUnique({ where: { slug: 'downtown' } });
  if (!location) throw new Error("Location 'downtown' not found for menu seeding.");

  // Create allergens
  const allergens = await Promise.all(
    ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish', 'Sesame'].map(
      (name) => prisma.allergen.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const allergenMap = Object.fromEntries(allergens.map(a => [a.name, a.id]));

  // Mealtimes
  const lunch = await prisma.mealtime.createManyAndReturn({
    data: [{
      name: 'Lunch',
      startTime: '11:00',
      endTime: '15:00',
      days: [1, 2, 3, 4, 5],
      locationId: location.id,
    }],
    skipDuplicates: true,
  });

  const dinner = await prisma.mealtime.createManyAndReturn({
    data: [{
      name: 'Dinner',
      startTime: '17:00',
      endTime: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      locationId: location.id,
    }],
    skipDuplicates: true,
  });

  // Get mealtime IDs
  const lunchId = await prisma.mealtime.findFirst({ where: { name: 'Lunch', locationId: location.id } });
  const dinnerId = await prisma.mealtime.findFirst({ where: { name: 'Dinner', locationId: location.id } });

  // Categories
  const categories = await Promise.all([
    { name: 'Mezze & Starters', slug: 'appetizers', sortOrder: 1, isFrozenDelivery: false },
    { name: 'Mains', slug: 'main-courses', sortOrder: 2, isFrozenDelivery: false },
    { name: 'Flatbreads & Pizza', slug: 'pizzas', sortOrder: 3, isFrozenDelivery: false },
    { name: 'Frozen Delivery', slug: 'frozen', sortOrder: 4, isFrozenDelivery: true },
  ].map(cat => prisma.category.upsert({
    where: { slug: cat.slug },
    update: {},
    create: { ...cat, locationId: location.id }
  })));
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  // Menu items with options
  const margherita = await prisma.menuItem.upsert({
    where: { slug: 'margherita-pizza' },
    update: {},
    create: {
      name: 'Margherita Pizza',
      slug: 'margherita-pizza',
      description: 'San Marzano tomato sauce, buffalo mozzarella, fresh basil',
      price: 14.99,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
      categoryId: catMap['pizzas'],
      locationId: location.id,
      sortOrder: 1,
    },
  });

  // Pizza size option
  await prisma.menuOption.createMany({
    data: [
      {
        menuItemId: margherita.id,
        name: 'Size',
        displayType: 'RADIO',
        isRequired: true,
      }
    ],
    skipDuplicates: true,
  });

  const sizeOption = await prisma.menuOption.findFirst({ where: { menuItemId: margherita.id, name: 'Size' } });
  if (sizeOption) {
    await prisma.menuOptionValue.createMany({
      data: [
        { menuOptionId: sizeOption.id, name: '10" Small', priceModifier: 0, isDefault: true, sortOrder: 1 },
        { menuOptionId: sizeOption.id, name: '12" Medium', priceModifier: 3.00, sortOrder: 2 },
      ],
      skipDuplicates: true,
    });
  }

  // Frozen Item
  const frozenPizza = await prisma.menuItem.upsert({
    where: { slug: 'frozen-margherita' },
    update: {},
    create: {
      name: 'Frozen Margherita Pizza (Pack of 3)',
      slug: 'frozen-margherita',
      description: 'Our classic margherita, flash frozen for you to bake at home.',
      price: 35.00,
      categoryId: catMap['frozen'],
      locationId: location.id,
      sortOrder: 1,
      orderType: 'FROZEN_DELIVERY',
    },
  });

  // Allergen associations
  await prisma.menuItemAllergen.createMany({
    data: [
      { menuItemId: margherita.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: margherita.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: frozenPizza.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: frozenPizza.id, allergenId: allergenMap['Dairy'] },
    ],
    skipDuplicates: true,
  });

  // Mealtime associations
  if (lunchId && dinnerId) {
    await prisma.menuItemMealtime.createMany({
      data: [
        { menuItemId: margherita.id, mealtimeId: lunchId.id },
        { menuItemId: margherita.id, mealtimeId: dinnerId.id },
      ],
      skipDuplicates: true,
    });
  }
}
