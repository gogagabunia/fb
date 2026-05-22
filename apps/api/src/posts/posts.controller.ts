import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { PrismaClient, PostStatus } from 'database';

@Controller('posts')
export class PostsController {
  private readonly prisma = new PrismaClient();

  // Get all imported posts (Filterable by status & group)
  @Get()
  async getImportedPosts() {
    return this.prisma.importedPost.findMany({
      include: { group: true },
      orderBy: { scrapedAt: 'desc' }
    });
  }

  // Admin Queue moderation (Approve / Publish to public feed)
  @Post(':id/approve')
  async approvePost(
    @Param('id') id: string,
    @Body() body: { title: string; price: number; description: string; category: string; specs: any; location?: string }
  ) {
    const importedPost = await this.prisma.importedPost.findUnique({
      where: { id },
      include: { group: true }
    });

    if (!importedPost) {
      throw new Error(`Imported post ${id} not found`);
    }

    // Update status
    await this.prisma.importedPost.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    // Resolve Category
    let category = await this.prisma.category.findUnique({
      where: { name: body.category }
    });
    if (!category) {
      category = await this.prisma.category.create({
        data: {
          name: body.category,
          slug: body.category.toLowerCase().replace(/[^a-z0-9]/g, '-')
        }
      });
    }

    // Create public listing
    const listing = await this.prisma.listing.create({
      data: {
        title: body.title,
        price: body.price,
        description: body.description,
        images: importedPost.images,
        location: body.location || 'Unknown Location',
        category: body.category,
        specs: body.specs || {},
        originalPostUrl: importedPost.fbPostId,
        contactUrl: importedPost.authorProfile || importedPost.fbPostId,
        importedPostId: importedPost.id,
        categoryId: category.id
      }
    });

    return { success: true, listing };
  }

  // Reject Post
  @Post(':id/reject')
  async rejectPost(@Param('id') id: string, @Body('reason') reason: string) {
    return this.prisma.importedPost.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });
  }

  // Delete Post
  @Delete(':id')
  async deletePost(@Param('id') id: string) {
    await this.prisma.importedPost.delete({
      where: { id }
    });
    return { success: true };
  }
}
