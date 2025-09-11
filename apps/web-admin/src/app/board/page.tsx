import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/board-v2');
  return null;
}
