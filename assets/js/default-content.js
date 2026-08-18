export const DEFAULT_SETTINGS = {
  business_phone: '+91 9546723997',
  whatsapp_number: '919546723997',
  business_email: 'VISIONWEBTECH.INFO@GMAIL.COM',
  instagram_url: 'https://www.instagram.com/visionwebtech/',
  instagram_handle: '@visionwebtech',
  primary_cta_text: 'Get Free Consultation',
  contact_heading: 'Let’s Build Your Website',
  contact_intro: 'Reach Vision Web Tech through your preferred channel and start the conversation about the right website for your business.'
};

export const DEFAULT_PACKAGES = [
  {
    slug: 'starter',
    name: 'Starter Website',
    price_text: '₹5,000',
    description: 'Best for individuals, freelancers and small businesses starting their online presence.',
    features: [
      'Professional responsive website',
      'Up to 3 core pages',
      'Modern UI design',
      'Mobile responsive design',
      'WhatsApp integration',
      'Phone/contact integration',
      'Instagram integration',
      'Basic SEO setup',
      'Contact / enquiry section',
      '1 year technical support',
      '1 year hosting included',
      'Basic performance optimization',
      'Basic security setup'
    ],
    is_visible: true,
    is_featured: false,
    sort_order: 1
  },
  {
    slug: 'business',
    name: 'Business Website',
    price_text: '₹9,000',
    description: 'Best for businesses that need a stronger online presence and more professional content.',
    features: [
      'Everything in Starter',
      'Up to 5–6 pages',
      'More customized design',
      'Advanced section layouts',
      'Better business presentation',
      'Enhanced animations',
      'Improved SEO structure',
      'Social media integration',
      'WhatsApp CTA throughout important sections',
      'Contact / enquiry experience',
      '1 year technical support',
      '1 year hosting included',
      'Performance optimization',
      'Basic security setup'
    ],
    is_visible: true,
    is_featured: true,
    sort_order: 2
  },
  {
    slug: 'premium',
    name: 'Premium Website',
    price_text: '₹15,000',
    description: 'Best for businesses looking for a premium and highly customized website.',
    features: [
      'Everything in Business',
      'Up to 8–10 pages depending on requirements',
      'Fully customized premium UI',
      'Advanced animations and interactions',
      'Premium visual presentation',
      'Advanced responsive optimization',
      'Enhanced SEO foundation',
      'Advanced business sections',
      'Social media integration',
      'WhatsApp conversion-focused CTAs',
      'Contact / enquiry experience',
      '1 year technical support',
      '1 year hosting included',
      'FREE domain for the first year',
      'Performance optimization',
      'Basic security setup',
      'Priority support'
    ],
    is_visible: true,
    is_featured: false,
    sort_order: 3
  }
];

export const DEFAULT_SERVICES = [
  { title: 'Business Website Development', description: 'Professional websites designed around the business, services, contact points and brand presentation.', is_visible: true, sort_order: 1 },
  { title: 'Landing Pages', description: 'High-converting pages for products, launches, promotions, offers and service campaigns.', is_visible: true, sort_order: 2 },
  { title: 'Responsive Web Design', description: 'Optimized experiences for mobile phones, tablets, laptops and desktop monitors.', is_visible: true, sort_order: 3 },
  { title: 'Basic SEO Setup', description: 'On-page SEO fundamentals, page metadata and search-friendly site structure.', is_visible: true, sort_order: 4 },
  { title: 'WhatsApp Integration', description: 'Direct connection for consultations, enquiries and faster business communication.', is_visible: true, sort_order: 5 },
  { title: 'Business Contact Integration', description: 'Phone, Instagram, WhatsApp and other relevant contact links placed strategically.', is_visible: true, sort_order: 6 },
  { title: 'Website Maintenance / Technical Support', description: 'Support is provided according to the selected package and agreed project scope.', is_visible: true, sort_order: 7 },
  { title: 'Performance-Focused Front End', description: 'Lightweight static code for faster loading and easier hosting on standard platforms.', is_visible: true, sort_order: 8 },
  { title: 'Future-Ready Static Architecture', description: 'Structured so that a backend, dashboard or advanced integrations can be added later if needed.', is_visible: true, sort_order: 9 }
];

export const DEFAULT_PORTFOLIO = [
  { title: 'Restaurant', description: 'Concept direction for food businesses that need a strong visual presentation and clear call-to-action flow.', category: 'Hospitality', website_url: '', image_url: '', is_visible: true, sort_order: 1 },
  { title: 'Coffee Shop', description: 'Warm, modern website concept for cafés and boutique beverage brands.', category: 'Hospitality', website_url: '', image_url: '', is_visible: true, sort_order: 2 },
  { title: 'Doctor / Clinic', description: 'Professional medical presentation with trust, clarity and responsive patient contact points.', category: 'Healthcare', website_url: '', image_url: '', is_visible: true, sort_order: 3 },
  { title: 'Interior Designer', description: 'Elegant service presentation for premium design-oriented businesses.', category: 'Design', website_url: '', image_url: '', is_visible: true, sort_order: 4 },
  { title: 'Real Estate', description: 'Structured property and service showcase direction for real-estate businesses.', category: 'Real Estate', website_url: '', image_url: '', is_visible: true, sort_order: 5 },
  { title: 'Consultant', description: 'Professional expert-led positioning for personal brands, consultants and advisors.', category: 'Professional Services', website_url: '', image_url: '', is_visible: true, sort_order: 6 }
];
