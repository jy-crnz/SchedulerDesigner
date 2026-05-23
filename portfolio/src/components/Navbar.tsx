import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'

// Defining constants outside the component prevents re-allocation on every render
const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Education', href: '#education' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
]

interface NavbarProps {
    active: string
}

export function Navbar({ active }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        if (!open) return
        const closeMenu = () => setOpen(false)
        document.addEventListener('click', closeMenu)
        return () => document.removeEventListener('click', closeMenu)
    }, [open])

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault()
        setOpen(false)
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
            <div className="navbar-inner">
                <a
                    href="#"
                    className="navbar-logo"
                    onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                >
                    jy<span>.crnz</span>
                </a>

                <ul className="navbar-links">
                    {NAV_LINKS.map(link => (
                        <li key={link.href}>
                            <a
                                href={link.href}
                                className={`navbar-link${active === link.href.slice(1) ? ' navbar-link--active' : ''}`}
                                onClick={e => scrollToSection(e, link.href)}
                            >
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>

                <button
                    className="hamburger"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    onClick={e => { e.stopPropagation(); setOpen(prev => !prev) }}
                >
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <div className={`mobile-menu${open ? ' mobile-menu--open' : ''}`} onClick={e => e.stopPropagation()}>
                {NAV_LINKS.map(link => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`mobile-link${active === link.href.slice(1) ? ' mobile-link--active' : ''}`}
                        onClick={e => scrollToSection(e, link.href)}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </nav>
    )
}