import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Link from 'next/link'

export default function GetStarted() {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-5xl rounded-3xl border px-6 py-12 md:py-20 lg:py-32">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Start Building</h2>
                    <p className="mt-4">Libero sapiente aliquam quibusdam aspernatur.</p>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="https://github.com/Devovia/Vonova/releases/download/v0.1.0/Vonova_Setup_0.1.0.exe">
                            <Download className="mr-2 size-4" />
                            <span className="text-nowrap">Download Free Demo</span>
                            </Link>
                        </Button>

                        <Button asChild size="lg" variant="outline">
                            <Link href="/">
                                <span>See Features</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}