import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui'

export function LandingPage() {
  return (
    <div className='grid min-h-screen place-items-center p-6 text-center'>
      <div className='flex max-w-md flex-col items-center gap-4'>
        <h1 className='font-display text-4xl font-semibold'>Vista</h1>
        <p className='text-muted-foreground'>Une roadmap produit partagée, depuis vos milestones &amp; issues GitHub.</p>
        <Link to='/login' className={buttonVariants()}>
          Commencer
        </Link>
      </div>
    </div>
  )
}
