import React from 'react';
import Image from 'next/image';
import styles from '@/styles/modules/Portfolio.module.scss';
import Link from 'next/link';
import { FiExternalLink } from 'react-icons/fi';
import { UrlObject } from 'url';
import classNames from 'classnames';

type Props = {
  imageUrl: string;
  category: string;
  title: string;
  href: string | UrlObject;
};

const Portfolio = ({ imageUrl, category, title, href }: Props) => {
  return (
    <div className={classNames(styles['portfolio'], 'group bg-[#1a1a2e] border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300')}>
      <div className="relative aspect-[4/3]">
        <Image
          src={imageUrl}
          layout="fill"
          alt={title}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/20 to-transparent opacity-60" />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <FiExternalLink className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Category badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/90 text-white backdrop-blur-sm">
            {category}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <Link href={href}>
          <a className="block text-sm font-bold text-white hover:text-indigo-400 transition-colors leading-snug">
            {title}
          </a>
        </Link>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          View Project
          <FiExternalLink size={12} className="group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
