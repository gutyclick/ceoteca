import type { Book } from '@/types';
import { BookCard } from './BookCard';
export function BookCarousel({title,books}:{title:string;books:Book[]}){return <section className="mt-10"><h2 className="mb-4 text-2xl font-black">{title}</h2><div className="no-scrollbar flex gap-4 overflow-x-auto pb-4" tabIndex={0} aria-label={title}>{books.map((book)=><BookCard key={book.id} book={book}/>)}</div></section>}
