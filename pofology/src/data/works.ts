import { Work } from '@/types';

export const works: Work[] = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    category: 'Backend Development',
    thumbnailUrl: '/images/works/portfolio-website.png',
    description: `A robust e-commerce platform built with .NET 9, utilizing ASP.NET Core, Entity Framework Core, and MediatR. It follows Clean Architecture and CQRS design patterns for scalability and maintainability. Key features include secure user authentication with JWT, comprehensive product management, and robust validation with FluentValidation. The project uses PostgreSQL for data storage, integrates extensive logging and error handling, and supports unit and integration testing for reliability. It is designed to handle high-traffic environments with a strong focus on security and performance optimization.`,
    publishedAt: '01 Jan 2024',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://github.com/NTDno1/BaseProject',
    featureList: [
      'Clean Architecture & CQRS Pattern',
      'JWT Authentication & Authorization',
      'Entity Framework Core with PostgreSQL',
      'FluentValidation for robust validation',
      'AutoMapper for object mapping',
      'Serilog for comprehensive logging',
      'Unit & Integration Testing',
      'RESTful API Design',
      'Performance Optimization',
      'Security Best Practices',
      'Docker Support',
      'Comprehensive Error Handling',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Personal Project',
      },
      {
        name: 'Start Date',
        value: '01 Jan 2024',
      },
      {
        name: 'End Date',
        value: 'Ongoing',
      },
      {
        name: 'Category',
        value: 'Backend Development',
      },
      {
        name: 'Skills',
        value: '.NET 9, C#, ASP.NET Core, EF Core, PostgreSQL, Clean Architecture, CQRS',
      },
      {
        name: 'Repository',
        value: 'GitHub',
      },
      {
        name: 'License',
        value: 'MIT',
      },
    ],
  },

  {
    id: 2,
    title: 'ERP System Integration',
    category: 'System Integration',
    thumbnailUrl: '/images/works/social-media-app.png',
    description: `Built from scratch a middleware service to integrate TikTok platform APIs and synchronize data with the ERP system. The solution was designed based on a base architecture and implemented using a Three-Layer Architecture (Presentation, Business Logic, Data Access) to ensure extensibility, maintainability, and scalability for future e-commerce platforms.`,
    publishedAt: '01 Aug 2023',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://github.com/NTDno1',
    featureList: [
      'Bi-directional API integration with TikTok',
      'Webhook support for real-time synchronization',
      'Automated ETL workflows',
      'Facebook Ads data pipeline',
      'Campaign insights extraction',
      'Revenue and cost metrics reporting',
      'Three-Layer Architecture',
      'Extensible for multiple platforms',
      'Real-time data synchronization',
      'Performance monitoring',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'HOP LONG TECH',
      },
      {
        name: 'Start Date',
        value: '01 Aug 2023',
      },
      {
        name: 'End Date',
        value: '01 Dec 2023',
      },
      {
        name: 'Category',
        value: 'System Integration',
      },
      {
        name: 'Skills',
        value: '.NET, SQL Server, API Integration, ETL',
      },
      {
        name: 'Platform',
        value: 'TikTok, Facebook Ads',
      },
    ],
  },
  {
    id: 3,
    title: 'Marketplace Website (Ebay Clone)',
    category: 'Web Development',
    thumbnailUrl: '/images/works/marketplace-website.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },

  {
    id: 4,
    title: 'Garments Management System',
    category: 'Web Development',
    thumbnailUrl: '/images/works/garments-management-system.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },

  {
    id: 5,
    title: 'POS System & Inventory Management',
    category: 'Web Development',
    thumbnailUrl: '/images/works/point-of-sale.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 6,
    title: 'Multi Vendor Ecommerce System',
    category: 'Web Development',
    thumbnailUrl: '/images/works/ecommerce.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 7,
    title: 'Digital Ecommerce Website Design',
    category: 'UI/UX Design',
    thumbnailUrl: '/images/works/ecommerce-website-design.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 8,
    title: 'Digital Marketing App & Website',
    category: 'Mobile App',
    thumbnailUrl: '/images/works/digital-marketing-app.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 9,
    title: 'Food Delivery System & Ecommerce',
    category: 'Mobile App',
    thumbnailUrl: '/images/works/food-delivery-app.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 10,
    title: 'Project Management System',
    category: 'Web Development',
    thumbnailUrl: '/images/works/project-management-system.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 11,
    title: 'Learning Management System',
    category: 'Web Development',
    thumbnailUrl: '/images/works/learning-management-system.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
  {
    id: 12,
    title: 'ERP System & Inventory Management',
    category: 'Web Development',
    thumbnailUrl: '/images/works/erp-system.png',
    description: `Cras id dui. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos hymenaeos.
    Vivamus laoreet. Praesent turpis. Nunc nulla.Praesent nec nisl a purus blandit viverra. Nullam dictum felis
    eu pede mollis pretium. Curabitur vestibulum aliquam leo. Sed libero. Praesent metus tellus, elementum eu,
    semper a, adipiscing nec Vestibulum ullamcorper mauris at ligula. Phasellus consectetuer vestibulum elit.
    Sed a libero. Vivamus consectetuer hendrerit lacus. Quisque ut nisi.Cum sociis natoque penatibus`,
    publishedAt: '01 July 2022',
    images: ['/images/works/work-01.png', '/images/works/work-02.png', '/images/works/work-03.png'],
    previewUrl: 'https://pofology.bdlancers.com/',
    featureList: [
      '100% Fluid Responsive – Fits any device perfectly',
      'Tested on real devices',
      'Flexible Layout',
      `
        Use our demo layout or create your own visually different experience using page Vcamp and feature-rich
        backend`,
      'Unlimited Sidebars',
      'Retina Optimized',
      'Advanced Admin Panel',
      'Demo Import, Content and Sliders',
      'Social Links',
      'Bottom Footer Widgets',
      'Clean &amp; Commented Code',
      'Advanced Typography',
      'Google Fonts – 600+ Font families available',
      'Custom Font Support',
      'Custom Page Templates',
      'Pixel Perfect Design',
      'Quick &amp; Easy Installation &amp; Setup',
      'Custom CSS Ready',
      'HTML5 &amp; CSS3',
      'Easy Customization With Variable Content Sections',
      'Custom Build Theme &amp; Page Options',
      'SEO Ready',
    ],
    attributes: [
      {
        name: 'Client',
        value: 'Pofology',
      },
      {
        name: 'Start Date',
        value: '01 July 2022',
      },
      {
        name: 'End Date',
        value: '01 October 2022',
      },
      {
        name: 'Category',
        value: 'Web Development',
      },
      {
        name: 'Skills',
        value: 'Typescript, Next.js & Tailwind CSS',
      },
      {
        name: 'Current Version',
        value: '3.0.0',
      },
      {
        name: 'Lisence',
        value: 'MIT',
      },
    ],
  },
];
