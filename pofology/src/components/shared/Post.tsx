import Image from 'next/image';
import React from 'react';
import styles from '@/styles/modules/Post.module.scss';
import Link from 'next/link';
import classNames from 'classnames';

type Props = {
  thumbnailUrl: string;
  title: string;
  publishedAt: string;
  href: string;
};

const Post = ({ thumbnailUrl, title, publishedAt, href }: Props) => {
  return (
    <div className={classNames(styles['post'], 'group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300')}>
      <Link href={href}>
        <a className="block overflow-hidden">
          <div className="relative aspect-[16/9]">
            <Image
              src={thumbnailUrl}
              layout="fill"
              alt={title}
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
        </a>
      </Link>
      <div className="p-5">
        <Link href={href}>
          <a className="block text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors leading-snug">
            {title}
          </a>
        </Link>
        <time className="mt-3 inline-block text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {publishedAt}
        </time>
      </div>
    </div>
  );
};

export default Post;
