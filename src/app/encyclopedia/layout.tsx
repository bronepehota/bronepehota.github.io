import { ReactNode } from 'react';
import { ENCYCLOPEDIA_TITLE, ENCYCLOPEDIA_DESCRIPTION } from './meta';

export const metadata = {
  title: ENCYCLOPEDIA_TITLE,
  description: ENCYCLOPEDIA_DESCRIPTION,
};

export default function EncyclopediaLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
