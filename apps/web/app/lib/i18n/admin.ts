import type { Lang } from '../i18n';

/**
 * Strings for the admin panel (/admin).
 * Dynamic values use {placeholder} tokens replaced at the call site.
 */
export const adminStrings = {
  // Toasts
  roleUpdated: {
    ka: 'როლი განახლდა.',
    en: 'Role updated.',
  },
  roleUpdateFailed: {
    ka: 'როლის განახლება ვერ მოხერხდა.',
    en: 'Failed to update role.',
  },
  listingDeactivated: {
    ka: 'განცხადება გამოირთო.',
    en: 'Listing deactivated.',
  },
  listingReactivated: {
    ka: 'განცხადება კვლავ გააქტიურდა.',
    en: 'Listing reactivated.',
  },
  listingUpdateFailed: {
    ka: 'განცხადების განახლება ვერ მოხერხდა.',
    en: 'Failed to update listing.',
  },
  approvedPublished: {
    ka: 'დამტკიცდა და გამოქვეყნდა.',
    en: 'Approved and published.',
  },
  approvalFailed: {
    ka: 'დამტკიცება ვერ მოხერხდა.',
    en: 'Approval failed.',
  },
  rejectedToast: {
    ka: 'უარყოფილია.',
    en: 'Rejected.',
  },
  rejectionFailed: {
    ka: 'უარყოფა ვერ მოხერხდა.',
    en: 'Rejection failed.',
  },
  rejectPromptFor: {
    ka: 'უარყოფ {name}-ის პოსტს? მიზეზი (არასავალდებულო):',
    en: 'Reject the post from {name}? Reason (optional):',
  },
  listingFrom: {
    ka: 'განცხადება — {name}',
    en: 'Listing from {name}',
  },

  // Header
  adminBadge: {
    ka: 'ადმინი',
    en: 'Admin',
  },
  tabUsers: {
    ka: 'მომხმარებლები',
    en: 'users',
  },
  tabListings: {
    ka: 'განცხადებები',
    en: 'listings',
  },
  tabModeration: {
    ka: 'მოდერაცია',
    en: 'moderation',
  },
  loading: {
    ka: 'იტვირთება…',
    en: 'Loading…',
  },

  // Users table
  thUser: {
    ka: 'მომხმარებელი',
    en: 'User',
  },
  thGroups: {
    ka: 'ჯგუფები',
    en: 'Groups',
  },
  thPosts: {
    ka: 'პოსტები',
    en: 'Posts',
  },
  thJoined: {
    ka: 'რეგისტრაცია',
    en: 'Joined',
  },
  thRole: {
    ka: 'როლი',
    en: 'Role',
  },
  roleBuyer: {
    ka: 'მყიდველი',
    en: 'Buyer',
  },
  roleSeller: {
    ka: 'გამყიდველი',
    en: 'Seller',
  },
  roleAdmin: {
    ka: 'ადმინი',
    en: 'Admin',
  },
  noUsers: {
    ka: 'მომხმარებლები ჯერ არ არიან.',
    en: 'No users yet.',
  },

  // Listings table
  thListing: {
    ka: 'განცხადება',
    en: 'Listing',
  },
  thCategory: {
    ka: 'კატეგორია',
    en: 'Category',
  },
  thSeller: {
    ka: 'გამყიდველი',
    en: 'Seller',
  },
  thPrice: {
    ka: 'ფასი',
    en: 'Price',
  },
  thStatus: {
    ka: 'სტატუსი',
    en: 'Status',
  },
  statusActive: {
    ka: 'აქტიური',
    en: 'Active',
  },
  statusDeactivated: {
    ka: 'გამორთული',
    en: 'Deactivated',
  },
  deactivate: {
    ka: 'გამორთვა',
    en: 'Deactivate',
  },
  reactivate: {
    ka: 'გააქტიურება',
    en: 'Reactivate',
  },
  noListings: {
    ka: 'განცხადებები ჯერ არ არის.',
    en: 'No listings yet.',
  },

  // Moderation tab
  noPending: {
    ka: 'მომლოდინე პოსტები არ არის. ყველა რიგი სუფთაა.',
    en: 'No pending posts anywhere. All queues are clear.',
  },
  sellerLabel: {
    ka: 'გამყიდველი',
    en: 'seller',
  },
  approveBtn: {
    ka: 'დამტკიცება…',
    en: 'Approve…',
  },
  rejectBtn: {
    ka: 'უარყოფა',
    en: 'Reject',
  },

  // Approve modal
  approveOnBehalf: {
    ka: '{email}-ის სახელით დამტკიცება',
    en: 'Approve on behalf of {email}',
  },
  title: {
    ka: 'სათაური',
    en: 'Title',
  },
  category: {
    ka: 'კატეგორია',
    en: 'Category',
  },
  price: {
    ka: 'ფასი (₾)',
    en: 'Price (₾)',
  },
  location: {
    ka: 'მდებარეობა',
    en: 'Location',
  },
  description: {
    ka: 'აღწერა',
    en: 'Description',
  },
  cancel: {
    ka: 'გაუქმება',
    en: 'Cancel',
  },
  publishListing: {
    ka: 'განცხადების გამოქვეყნება',
    en: 'Publish listing',
  },
} as const satisfies Record<string, Record<Lang, string>>;
