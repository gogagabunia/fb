import 'reflect-metadata';
import { PrismaClient } from 'database';
import { PlaywrightScraperService } from '../apps/api/src/scrapers/playwright-scraper.service';
import { OpenAIParserService } from '../apps/api/src/parser/openai-parser.service';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🚀 GroupMarket: Starting Ingestion & AI Parsing Pipeline Test');
  console.log('================================================================');

  try {
    // 1. Provision / Verify Mock User
    console.log('👤 Verifying test Admin User in database...');
    const user = await prisma.user.upsert({
      where: { email: 'test@groupmarket.com' },
      update: {},
      create: {
        clerkId: 'user_clerk_123',
        email: 'test@groupmarket.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin User active: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

    // 2. Provision / Verify Mock Facebook Group
    console.log('👥 Verifying test Scottsdale Cars & Classifieds Facebook Group...');
    const group = await prisma.facebookGroup.upsert({
      where: { groupId: '123456789' },
      update: {
        keywords: ['car', 'sell', 'price', '$', 'keyboard', 'headphones', 'iphone', 'sale', 'asking', 'runs', 'clean']
      },
      create: {
        groupId: '123456789',
        name: 'Scottsdale Cars & Classifieds',
        url: 'https://facebook.com/groups/scottsdale-classifieds',
        isPublic: true,
        isActive: true,
        keywords: ['car', 'sell', 'price', '$', 'keyboard', 'headphones', 'iphone', 'sale', 'asking', 'runs', 'clean'],
        userId: user.id,
      },
    });
    console.log(`✅ Facebook Group active: ${group.name} (DB ID: ${group.id})`);

    // 3. Instantiate services
    console.log('🔧 Instantiating Scraper and OpenAI Parser Services...');
    const scraper = new PlaywrightScraperService();
    const parser = new OpenAIParserService();

    // 4. Trigger Scraping (which will engage local fallback if blocked by Facebook)
    console.log(`📡 Scraping posts for group ID: ${group.id} (${group.name})...`);
    const rawPosts = await scraper.scrapeGroup(group.id, 10);
    console.log(`📦 Scraped ${rawPosts.length} posts successfully.`);

    // 5. Parse, Classify and Persist posts
    let listingsCount = 0;
    let noiseCount = 0;

    console.log('\n================================================================');
    console.log('🧠 Running AI Parsing & Classification Filtering');
    console.log('================================================================\n');

    for (const post of rawPosts) {
      console.log(`📝 Processing post by ${post.author} (FB ID: ${post.id})...`);
      console.log(`----------------------------------------------------------------`);
      console.log(`[RAW TEXT]:\n${post.text}\n`);

      // Run it through the Parser Service
      const parsed = await parser.parseRawPost(post.text);

      if (parsed.isListing) {
        listingsCount++;
        console.log(`✨ [CLASSIFIED AS LISTING]`);
        console.log(`   🏷️  Title:      ${parsed.title}`);
        console.log(`   📂 Category:   ${parsed.category}`);
        console.log(`   💰 Price:      ${parsed.price !== undefined ? `$${parsed.price.toLocaleString()}` : 'N/A'}`);
        console.log(`   📍 Location:   ${parsed.location || 'N/A'}`);
        console.log(`   ⚙️  Specs:      ${JSON.stringify(parsed.specs)}`);

        // Persist listing to database
        const importedPost = await prisma.importedPost.upsert({
          where: { fbPostId: post.id },
          update: {
            rawText: post.text,
            images: post.images,
            authorName: post.author,
            authorProfile: `https://facebook.com/profile/${post.author.replace(/\s+/g, '').toLowerCase()}`,
            priceScraped: parsed.price || null,
            status: 'PENDING',
          },
          create: {
            fbPostId: post.id,
            rawText: post.text,
            images: post.images,
            authorName: post.author,
            authorProfile: `https://facebook.com/profile/${post.author.replace(/\s+/g, '').toLowerCase()}`,
            priceScraped: parsed.price || null,
            status: 'PENDING',
            groupId: group.id,
            userId: user.id,
          },
        });

        console.log(`💾 Persisted ImportedPost to Database! UUID: ${importedPost.id}\n`);
      } else {
        noiseCount++;
        console.log(`❌ [CLASSIFIED AS NOISE - FILTERED OUT]`);
        console.log(`   Reason: Post does not meet active selling criteria or is a discussion/query.\n`);
      }
    }

    // 6. Complete Ingestion Logging verification
    console.log('================================================================');
    console.log('📊 Pipeline Test Execution Summary');
    console.log('================================================================');
    console.log(`✅ Total Scraped Posts:   ${rawPosts.length}`);
    console.log(`📈 Classified Listings:   ${listingsCount}`);
    console.log(`🗑️  Filtered Noise Posts:  ${noiseCount}`);
    console.log(`================================================================`);
    console.log('🎉 Pipeline testing successfully completed!');

  } catch (error) {
    console.error('❌ Pipeline Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
