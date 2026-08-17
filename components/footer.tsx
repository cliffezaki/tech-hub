export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} Tech Hub. All rights reserved.
                </p>
                <div className="flex gap-4">
                    <a
                        href="#"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        Terms
                    </a>
                    <a
                        href="#"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        Privacy
                    </a>
                </div>
            </div>
        </footer>
    );
}
