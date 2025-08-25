import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Limpar dados existentes
  await prisma.productVariation.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Criar categorias
  const eletronicos = await prisma.category.create({
    data: {
      name: 'Eletrônicos',
      description: 'Produtos eletrônicos em geral'
    }
  });

  const celulares = await prisma.category.create({
    data: {
      name: 'Celulares',
      description: 'Smartphones e acessórios'
    }
  });

  const computadores = await prisma.category.create({
    data: {
      name: 'Computadores',
      description: 'Notebooks, desktops e acessórios'
    }
  });

  const games = await prisma.category.create({
    data: {
      name: 'Games',
      description: 'Consoles, jogos e acessórios gamer'
    }
  });

  // Criar usuário
  const user = await prisma.user.create({
    data: {
      email: 'eduardo@example.com',
      firstName: 'Eduardo',
      lastName: 'Pereira',
      password: '123456',
      role: 'CUSTOMER',
    },
  });

  // Criar produtos
  const products = [
    {
      name: 'Smartphone Galaxy Pro',
      description: 'Smartphone de última geração com câmera de 108MP, tela AMOLED 6.7" e processador Snapdragon 8 Gen 2.',
      brand: 'Samsung',
      categoryId: celulares.id,
      basePrice: 2999.00,
      variations: [
        {
          size: '128GB',
          color: 'Preto',
          material: 'Vidro',
          price: 2999.00,
          stock: 15,
          sku: 'GALAXY-PRO-128-BLK',
        },
        {
          size: '256GB',
          color: 'Azul',
          material: 'Vidro',
          price: 3499.00,
          stock: 10,
          sku: 'GALAXY-PRO-256-BLU',
        },
      ],
    },
    {
      name: 'Notebook Ultra Slim',
      description: 'Notebook ultra fino com tela de 14" Full HD, processador Intel i7, 16GB RAM e SSD de 512GB.',
      brand: 'Dell',
      categoryId: computadores.id,
      basePrice: 4599.00,
      variations: [
        {
          size: '14"',
          color: 'Prata',
          material: 'Alumínio',
          price: 4599.00,
          stock: 8,
          sku: 'DELL-ULTRA-14-SLV',
        },
        {
          size: '15.6"',
          color: 'Preto',
          material: 'Alumínio',
          price: 5299.00,
          stock: 5,
          sku: 'DELL-ULTRA-15-BLK',
        },
      ],
    },
    {
      name: 'Fone de Ouvido Wireless Pro',
      description: 'Fone de ouvido com cancelamento de ruído ativo, bateria de 30h e qualidade de áudio premium.',
      brand: 'Sony',
      categoryId: eletronicos.id,
      basePrice: 899.00,
      variations: [
        {
          size: 'Padrão',
          color: 'Preto',
          material: 'Plástico',
          price: 899.00,
          stock: 25,
          sku: 'SONY-WH-1000-BLK',
        },
        {
          size: 'Padrão',
          color: 'Branco',
          material: 'Plástico',
          price: 899.00,
          stock: 20,
          sku: 'SONY-WH-1000-WHT',
        },
      ],
    },
    {
      name: 'Smart TV 4K 55"',
      description: 'Smart TV com resolução 4K, HDR, Android TV e controle por voz integrado.',
      brand: 'LG',
      categoryId: eletronicos.id,
      basePrice: 2499.00,
      variations: [
        {
          size: '55"',
          color: 'Preto',
          material: 'Plástico',
          price: 2499.00,
          stock: 12,
          sku: 'LG-TV-55-4K-BLK',
        },
        {
          size: '65"',
          color: 'Preto',
          material: 'Plástico',
          price: 3499.00,
          stock: 8,
          sku: 'LG-TV-65-4K-BLK',
        },
      ],
    },
    {
      name: 'Câmera DSLR Profissional',
      description: 'Câmera DSLR com sensor full-frame, 45MP e gravação de vídeo 8K.',
      brand: 'Canon',
      categoryId: eletronicos.id,
      basePrice: 8999.00,
      variations: [
        {
          size: 'Padrão',
          color: 'Preto',
          material: 'Magnésio',
          price: 8999.00,
          stock: 6,
          sku: 'CANON-EOS-R5-BLK',
        },
        {
          size: 'Kit com Lente',
          color: 'Preto',
          material: 'Magnésio',
          price: 12999.00,
          stock: 4,
          sku: 'CANON-EOS-R5-KIT',
        },
      ],
    },
    {
      name: 'Tablet iPad Air',
      description: 'Tablet com tela de 10.9", chip M1, câmera traseira de 12MP e suporte à Apple Pencil.',
      brand: 'Apple',
      categoryId: eletronicos.id,
      basePrice: 3999.00,
      variations: [
        {
          size: '64GB',
          color: 'Prata',
          material: 'Alumínio',
          price: 3999.00,
          stock: 18,
          sku: 'APPLE-IPAD-AIR-64-SLV',
        },
        {
          size: '256GB',
          color: 'Azul',
          material: 'Alumínio',
          price: 4999.00,
          stock: 15,
          sku: 'APPLE-IPAD-AIR-256-BLU',
        },
      ],
    },
    {
      name: 'Console de Videogame',
      description: 'Console de nova geração com SSD ultra-rápido, ray tracing e compatibilidade com jogos 4K.',
      brand: 'Sony',
      categoryId: eletronicos.id,
      basePrice: 3499.00,
      variations: [
        {
          size: '1TB',
          color: 'Branco',
          material: 'Plástico',
          price: 3499.00,
          stock: 10,
          sku: 'SONY-PS5-1TB-WHT',
        },
        {
          size: '2TB',
          color: 'Preto',
          material: 'Plástico',
          price: 3999.00,
          stock: 7,
          sku: 'SONY-PS5-2TB-BLK',
        },
      ],
    },
    {
      name: 'Smartwatch Fitness',
      description: 'Smartwatch com monitor cardíaco, GPS integrado, resistente à água e bateria de 7 dias.',
      brand: 'Garmin',
      categoryId: eletronicos.id,
      basePrice: 1299.00,
      variations: [
        {
          size: '45mm',
          color: 'Preto',
          material: 'Silicone',
          price: 1299.00,
          stock: 22,
          sku: 'GARMIN-FENIX-45-BLK',
        },
        {
          size: '47mm',
          color: 'Azul',
          material: 'Silicone',
          price: 1499.00,
          stock: 18,
          sku: 'GARMIN-FENIX-47-BLU',
        },
      ],
    },
    {
      name: 'Drone Profissional',
      description: 'Drone com câmera 4K, estabilização de 3 eixos, alcance de 7km e bateria de 30 minutos.',
      brand: 'DJI',
      categoryId: eletronicos.id,
      basePrice: 5999.00,
      variations: [
        {
          size: 'Padrão',
          color: 'Cinza',
          material: 'Plástico',
          price: 5999.00,
          stock: 9,
          sku: 'DJI-MAVIC-3-GRY',
        },
        {
          size: 'Combo Pro',
          color: 'Cinza',
          material: 'Plástico',
          price: 7999.00,
          stock: 6,
          sku: 'DJI-MAVIC-3-PRO',
        },
      ],
    },
  ];

  // Criar produtos e variações
  for (const productData of products) {
    const { variations, ...productInfo } = productData;
    
    const product = await prisma.product.create({
      data: productInfo,
    });

    // Criar imagem principal para o produto
    let imageUrl = '';
    
    // Mapear imagens específicas para cada produto
    switch (productInfo.name) {
      case 'Smartphone Galaxy Pro':
        imageUrl = 'https://samsungbrshop.vtexassets.com/arquivos/ids/258304-300-auto?v=638887967570970000&width=300&height=auto&aspect=true';
        break;
      case 'Notebook Ultra Slim':
        imageUrl = 'https://imgs.casasbahia.com.br/55069352/1g.jpg?imwidth=500';
        break;
      case 'Fone de Ouvido Wireless Pro':
        imageUrl = 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRdl2-sFstuMmR-195FYkIag445Rf_hBzsn5dnx7_WHcTmjVyATssqUcnR-e8ndXrjnu_rmmF2UBdu78AawzJ4PfPxH8dmTlQ';
        break;
      case 'Smart TV 4K 55"':
        imageUrl = 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcStuLxRjpt_akKh_0Vyq14ORlatbhzQikFWWuiYz_qlaBuQ3_05bR6VNqV7T_Rcsi-sNQDbucg3z9jpHUh2iHbdzIXURtMFWkvEpsFN8sEbfM6MwSqqZ4sfXw';
        break;
      case 'Câmera DSLR Profissional':
        imageUrl = 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQiCCl01CJI5rBKDcUm9xRDUyQ3pHG_6saiB6ihQeohE9qU20ZzY-nvh38SifOv6ERoPozU4qFUZEFCMUVttwRErZbioGz-sed7Vyg3kiU31irTn5SbpRTVZQ';
        break;
      case 'Tablet iPad Air':
        imageUrl = 'https://a-static.mlcdn.com.br/1500x1500/tablet-samsung-a9-64gb-4g-wifi-8-7-grafite-sm-x115nzaal05/commcenter/e000651/435f077a55e6f2e049ab90d5ae74ec5a.jpeg';
        break;
      case 'Console de Videogame':
        imageUrl = 'https://http2.mlstatic.com/D_NQ_NP_994674-MLA84537988952_052025-O.webp';
        break;
      case 'Smartwatch Fitness':
        imageUrl = 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRdl2-sFstuMmR-195FYkIag445Rf_hBzsn5dnx7_WHcTmjVyATssqUcnR-e8ndXrjnu_rmmF2UBdu78AawzJ4PfPxH8dmTlQ';
        break;
      case 'Drone Profissional':
        imageUrl = 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcStuLxRjpt_akKh_0Vyq14ORlatbhzQikFWWuiYz_qlaBuQ3_05bR6VNqV7T_Rcsi-sNQDbucg3z9jpHUh2iHbdzIXURtMFWkvEpsFN8sEbfM6MwSqqZ4sfXw';
        break;
      default:
        // Fallback para produtos não mapeados
        imageUrl = `https://via.placeholder.com/400x400/667eea/ffffff?text=${encodeURIComponent(productInfo.name)}`;
    }
    
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: imageUrl,
        alt: productInfo.name,
        isPrimary: true,
        order: 0,
      },
    });

    for (const variationData of variations) {
      await prisma.productVariation.create({
        data: {
          ...variationData,
          productId: product.id,
        },
      });
    }
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });