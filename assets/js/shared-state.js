// GroupMarket Shared State & Mock Database Layer
// Persists the status of posts and groups across pages using localStorage

const DEFAULT_POSTS = [
  // User's Imported Posts (for imported-posts.html)
  {
    id: "user-post-1",
    title: "Custom Mechanical Keyboard",
    price: 180,
    category: "Electronics",
    sourceGroup: "Mechanical Enthusiasts Group",
    status: "pending",
    date: "Oct 24, 2:45 PM",
    description: "Imported from 'Mechanical Enthusiasts Group'. Full brass plate, hot-swappable PCB, and Lubed Gateron Yellow switches.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBF53vlfHp3g1BV1rgPrV-1yeYLvNtqpKPw0i1q-Gc1ZUVvrZrFdFLV0fcXcW2pMyLPTfsH556JOdQQm0AN9WoBnyTkUEuA333WtiHy1Yu0J6aDr0IlgO6dOjON3KsnBbY3lUcyrMGengoTLrxIf_GBGAccKxBrx8QcdSRjF-IJtvmKijQEgQTXROyqtsUQ1qzb74KCHFBaKOz_c4Tez8Dkbd06M6Q4rPwBsB6N7mhRxupy1ZgF7kX-P8WLVeKNl0J3TytHH_3TWf8",
    type: "user"
  },
  {
    id: "user-post-2",
    title: "Minimalist Ceramic Watch",
    price: 245,
    category: "Luxury",
    sourceGroup: "Luxury Resale Hub",
    status: "pending",
    date: "Oct 24, 1:12 PM",
    description: "Imported from 'Luxury Resale Hub'. Unworn, original packaging included. Quartz movement, scratch-resistant.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrg_k-9JdhFenuUvhqLwJOeZc5zWzRq_XyrIkObIzH5eVKIPGtmBxE1TJb2emyokDvxna_ep42Lv0KH2WLlf_c-m1UD99wMXQMafPS93almhk3B9W3sVUZD1Z53Dgg0TXOIsMX03EvhjUns1fclGpCggarKQ9I-cQwsRirOaEzNtihiqLcyEy6ujfhLjt9j4z0k0Lxsy89NwkrflS3ktkf8dQSDwCHEeGEJj3YUOz-cGGAXJmnAabLsMprI0KjvUeezgheWXyhVJc",
    type: "user"
  },
  {
    id: "user-post-3",
    title: "Performance Running Shoes",
    price: 95,
    category: "Footwear",
    sourceGroup: "Sneaker Heads Worldwide",
    status: "rejected",
    date: "Oct 24, 11:30 AM",
    description: "Imported from 'Sneaker Heads Worldwide'. Rejected due to missing verification of authenticity for limited edition items.",
    rejectionReason: "Missing authenticity serial number. For items over $200 market value, please include a photo of the original receipt or verification tag to ensure buyer trust.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmujjjWt_v-M3Cvv5Clf3G-_VWM_AMMMqZaDEicesESataIHcOWoR1agGT1TdO5NZoPPs7w4iHCTeiKwGwq3LhHrtp6Imi46TTJF2P31JCjTu2JS4e3UD2nyTDIBniciR9CSYKOPS8ro_LT-zGjMWZVNNaHyy42CfESyDeXZckbNEdlhCsCPGBsQSHz68fjAH1o-xoAhi8mmtX8kmH77pAJwq4OnJ6zT3eIaumiO2u4uHlYdGMNTJPy5C12-PZMpqhTUQ25Q7atrI",
    type: "user"
  },
  {
    id: "user-post-4",
    title: "Noise Cancelling Headphones",
    price: 320,
    category: "Audio",
    sourceGroup: "Audiophiles Global",
    status: "approved",
    date: "Oct 23, 9:20 PM",
    description: "Live on GroupMarket Marketplace. Synced across 4 active groups. High engagement recorded.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeaZ6ck25wLLPblFfVVyHzyj8e889AHIabISceQfsVvETeS5FS1ZZuTlz1mHlZP2ITrkgj3SWDPBwEaxOuiOFTPxTu5j1q4aEy8THNNG_V3ya_GhQp3zmUZMHaBxu_TZfFHlsGE0ShhfIXkIY20KS0wAmvMNeOGt1HAmXBs8lghNdfVsoj7JV6q9EjQ3pkwpqns5qmdYInk1iFpsisjJX7rpTzLVHHxzagb2C9QDyoYCy5SGg5GbcRbruvdf5Pbbtw7ousXZIGj1k",
    type: "user"
  },

  // Admin Queue Posts (for admin.html)
  {
    id: "admin-post-1",
    title: "Minimalist Quartz Watch",
    price: 120,
    category: "Electronics",
    sourceGroup: "NYC Tech Resale",
    status: "pending_review",
    date: "Oct 24, 2:45 PM",
    description: "Sleek, minimalist analog watch with a leather strap. Premium quality and beautiful construction.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuArpcPzzBgh65cU8PR5epqDy4__tzxjf7obJN7GqPhZ5i54vLkytRwIvuhqX2mordT3JX7W3mAMVho-9FopzXTT4CLgDDwKMXYib1wtTi6uoJI9bqO5skx1ynpMB85vmH6kfFb37m3GPy3J1iU_mpMb4Ov31OM4FSaphBmM2jxA8LR1DGj_W34zVvFLNFCXDtRK_WoYedQUIfqLlNn5GXt1zXA1YZ5b94095TOYooxpDw1L-EJ54jwxTfu-D0_6yAfhPh997le-DsU",
    type: "admin"
  },
  {
    id: "admin-post-2",
    title: "Pro Wireless Headphones",
    price: 299,
    category: "Audio",
    sourceGroup: "Audiophiles Global",
    status: "pending_review",
    date: "Oct 24, 1:12 PM",
    description: "High-fidelity over-ear headphones in matte black. Comfortable and has state-of-the-art noise cancellation.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDe9P4YBtqfqDeIW_dyqBS5kd099_nvknwHCcf_3PGpHlqWqg0CCq9EEi1PYovVrdvDGzDmdwjXR2JNY9Tdi0Qq7VdsTY-apPEAnVKmj-Cx1tyewZApm-8z7VxeV3fAtWRMkSNYQleDe6kqMJOIQCHHDmGO7nHIcbsDv2-5LPvQ6s4sT-EuM8Gq1jvtEhibyMG80eQDYRMKzIx2m5RgJrD5H5dLZxqpYM42dheAk1y41Zq2Cd-PS1VS0p4amoumsN_4sanXR_oAqV4",
    type: "admin"
  },
  {
    id: "admin-post-3",
    title: "Velocity Run Shoes",
    price: 85,
    category: "Footwear",
    sourceGroup: "Runners Hub Marketplace",
    status: "pending_review",
    date: "Oct 24, 11:30 AM",
    description: "Vibrant red athletic sneaker with responsive cushioning and lightweight build.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDGrCmpzqbylCBNr4NhJIl9uwifRuqn7y_jCJzJepW6R_2U_bLHp6UHC6HswjtmwPenQk1pT9y80iQ0zAcrXoOZDq77ahcV1VIRAdvJBkTpdbXed6cMxMcRBFaC3fuhqYKB1PpAL8vsnrd5pkiiVzlV07f1KSu-2Vk5EZ8cJKhKm6fiyIk2EJ0olJ0GxjUxxEFwnwJMvlMqRDipS6moiH4lx8XWjFDTFkADkLYD8QPebp0q1vJOOdrxwt5HgO0FTthNTqewmHoCBLQ",
    type: "admin"
  },
  {
    id: "admin-post-4",
    title: "Retro Instant Camera",
    price: 115,
    category: "Photography",
    sourceGroup: "Vintage Photo Swap",
    status: "pending_review",
    date: "Oct 23, 9:20 PM",
    description: "Vintage-style instant camera with a warm pastel finish. Fun to use and has great styling.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdpUmQMGntuuchmBAjKE4SSjhpqHEZ6YxgAlxKqZgV5Ezab56a1fohyUFRMqwxcQXSIGtjQi59gz9fiwx_EtNQD0IVjIb4-WlHJsVF997p0vmM3jJpzhBJ4Hw43ORn86So2Hr6SLEF6QkSysV9R_8BpSI-zd1rzxaCC4JwVDXEBh6-3BRdfBQujx4u09Frkvr2Wfe3LAbHWnjkA22QRq3GbUJNZXeU0CKTsUHRrMBjq5oQNMo7O1dGNoE34kc4o9wgy1KhBYml-TY",
    type: "admin"
  }
];

const DEFAULT_GROUPS = [
  { name: "Vintage Collectibles UK", time: "Connected 2 hours ago", icon: "group_add", type: "success" },
  { name: "Tech Resell Marketplace", time: "5 posts approved today", icon: "check_circle", type: "info" },
  { name: "Local Buy & Sell", time: "Auth token expiring soon", icon: "warning", type: "warning" }
];

// Initialize Storage
function initStorage() {
  if (!localStorage.getItem("groupmarket_posts")) {
    localStorage.setItem("groupmarket_posts", JSON.stringify(DEFAULT_POSTS));
  }
  if (!localStorage.getItem("groupmarket_groups")) {
    localStorage.setItem("groupmarket_groups", JSON.stringify(DEFAULT_GROUPS));
  }
}

// Get Data
function getPosts() {
  initStorage();
  return JSON.parse(localStorage.getItem("groupmarket_posts"));
}

function getGroups() {
  initStorage();
  return JSON.parse(localStorage.getItem("groupmarket_groups"));
}

// Save Data
function savePosts(posts) {
  localStorage.setItem("groupmarket_posts", JSON.stringify(posts));
  // Dispatch custom event for real-time reactive updates
  window.dispatchEvent(new Event("storage-update"));
}

function saveGroups(groups) {
  localStorage.setItem("groupmarket_groups", JSON.stringify(groups));
  window.dispatchEvent(new Event("storage-update"));
}

// Actions
function updatePostStatus(id, newStatus, reason = null) {
  const posts = getPosts();
  const postIndex = posts.findIndex(p => p.id === id);
  if (postIndex !== -1) {
    posts[postIndex].status = newStatus;
    if (reason) {
      posts[postIndex].rejectionReason = reason;
    }
    savePosts(posts);
  }
}

function deletePost(id) {
  const posts = getPosts();
  const updatedPosts = posts.filter(p => p.id !== id);
  savePosts(updatedPosts);
}

function addPost(title, price, category, sourceGroup, description, image) {
  const posts = getPosts();
  const newPost = {
    id: "user-post-" + Date.now(),
    title,
    price: parseFloat(price) || 0,
    category,
    sourceGroup,
    status: "pending",
    date: "Just now",
    description,
    image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    type: "user"
  };
  posts.unshift(newPost);
  savePosts(posts);
}

function addGroup(name) {
  const groups = getGroups();
  const newGroup = {
    name,
    time: "Connected just now",
    icon: "group_add",
    type: "success"
  };
  groups.unshift(newGroup);
  saveGroups(groups);
}

// Global initialization
initStorage();

// Export to window for global access
window.GMState = {
  getPosts,
  getGroups,
  savePosts,
  saveGroups,
  updatePostStatus,
  deletePost,
  addPost,
  addGroup
};
