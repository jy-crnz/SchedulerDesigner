import { useEffect, useRef, useState } from 'react'
import {
  Code2, Layers, Layout, Terminal,
  BarChart3, Database, Mail, ExternalLink,
  Cpu, GraduationCap, ArrowUp,
} from 'lucide-react'

// Asset Imports
import profilePhoto from './assets/profile-photo.webp'
import './styles/App.css' // Updated path

// Component Imports
import { Navbar } from './components/Navbar'
import { GithubIcon, LinkedInIcon } from './components/Icons' // Added import

// --- Custom Hooks --- 
// (Architecture tip: These are great candidates to move to src/hooks/ later)
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect() } },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return progress
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-40% 0px -55% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [ids])
  return active
}

// Data
const SKILLS = [
  { name: 'JavaScript (ES6+)', icon: <Terminal className="skill-icon" /> },
  { name: 'React & TypeScript', icon: <Layers className="skill-icon" /> },
  { name: 'Node.js', icon: <Cpu className="skill-icon" /> },
  { name: 'HTML5 & CSS3', icon: <Layout className="skill-icon" /> },
  { name: 'Chart.js', icon: <BarChart3 className="skill-icon" /> },
  { name: 'Data Visualization', icon: <Code2 className="skill-icon" /> },
  { name: 'Responsive Design', icon: <Layout className="skill-icon" /> },
  { name: 'Database / SQL', icon: <Database className="skill-icon" /> },
]

const PROJECTS = [
  {
    title: 'Surgery Operation Dashboard',
    description: 'A real-time surgical analytics dashboard designed to track Operating Room turnover times. Features client-side CSV parsing and dynamic data filtering using Chart.js.',
    tags: ['JavaScript', 'Chart.js', 'Data Analytics'],
    github: 'https://github.com/jy-crnz/Surgery-Operation-Dashboard',
    demo: 'https://jy-crnz.github.io/Surgery-Operation-Dashboard/',
  },
  {
    title: 'The Krusty Krab',
    description: 'A themed website featuring a menu, gallery, and contact section. Includes embedded 3D models and interactive carousels for an immersive experience.',
    tags: ['HTML/CSS', 'JavaScript', '3D Integration'],
    github: 'https://github.com/jy-crnz/The-Krusty-Krab',
    demo: 'https://jy-crnz.github.io/The-Krusty-Krab/index.html',
  },
  {
    title: 'Scheduler Designer',
    description: 'A specialized tool for designing and managing complex schedules with a focus on user-friendly interface design and intuitive UX patterns.',
    tags: ['JavaScript', 'Web Apps'],
    github: 'https://github.com/jy-crnz/SchedulerDesigner',
    demo: 'https://scheduler-designer.vercel.app/',
  },
]

const EDUCATION = [
  {
    degree: 'Bachelor of Science in Information Technology',
    school: 'Technological University of the Philippines — Manila',
    period: '2022 – Present',
    status: '3rd Year',
    note: 'Specializing in full-stack development and data systems',
  },
]

// Section Wrapper
function AnimatedSection({ children, id }: { children: React.ReactNode; id?: string }) {
  const ref = useFadeUp()
  return (
    <section id={id}>
      <div ref={ref} className="fade-up">{children}</div>
    </section>
  )
}

export default function App() {
  const progress = useScrollProgress()
  const active = useActiveSection(['about', 'education', 'skills', 'projects', 'contact'])
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const handleScrollTopVisibility = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScrollTopVisibility, { passive: true })
    return () => window.removeEventListener('scroll', handleScrollTopVisibility)
  }, [])

  return (
    <>
      <div className="scroll-progress-track" aria-hidden="true">
        <div className="scroll-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <Navbar active={active} />

      <button
        className={`back-to-top${showTop ? ' back-to-top--visible' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={18} />
      </button>

      <div className="portfolio">
        <header className="hero">
          <div className="hero-inner">
            <div className="hero-text-group">
              <p className="hero-eyebrow">// portfolio</p>
              <h1>Jay Lawrence<br />C. Cerniaz</h1>
              <p className="hero-tagline">
                IT Student at TUP &amp; aspiring full-stack developer — building things for the web, one commit at a time.
              </p>
              <div className="hero-cta">
                <span className="hero-badge"><span className="status-dot" />Open to opportunities</span>
              </div>
            </div>

            <div className="hero-photo-wrapper">
              <img src={profilePhoto} alt="Jay Lawrence C. Cerniaz" className="hero-photo" loading="lazy" />
            </div>
          </div>
        </header>

        <main>
          <AnimatedSection id="about">
            <p className="section-label">01 / about</p>
            <h2>About Me</h2>
            <p className="about-text">
              I am a <strong>3rd Year Information Technology</strong> student at the{' '}
              <strong>Technological University of the Philippines</strong>. I am deeply passionate about
              expanding my technical horizons and am currently focused on sharpening my skills across
              various fields within the IT department to become a versatile and effective developer.
            </p>
          </AnimatedSection>

          <AnimatedSection id="education">
            <p className="section-label">02 / education</p>
            <h2>Education</h2>
            <div className="education-list">
              {EDUCATION.map((item, i) => (
                <div key={i} className="education-item">
                  <div className="education-icon"><GraduationCap size={22} /></div>
                  <div>
                    <div className="education-degree">{item.degree}</div>
                    <div className="education-school">{item.school}</div>
                    <div className="education-meta">
                      <span className="edu-tag">{item.period}</span>
                      <span className="edu-tag">{item.status}</span>
                      <span className="edu-tag">{item.note}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection id="skills">
            <p className="section-label">03 / skills</p>
            <h2>Technical Skills</h2>
            <div className="skills-grid">
              {SKILLS.map((skill, i) => (
                <div key={i} className="skill-card">{skill.icon}<span>{skill.name}</span></div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection id="projects">
            <p className="section-label">04 / projects</p>
            <h2>Featured Projects</h2>
            <div className="projects-grid">
              {PROJECTS.map((project, i) => (
                <article key={i} className="project-card">
                  <span className="project-number">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                  <div className="project-links">
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                      <GithubIcon size={14} /> GitHub
                    </a>
                    <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project-link project-link--demo">
                      Live Demo <ExternalLink size={14} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection id="contact">
            <p className="section-label">05 / contact</p>
            <h2>Get in Touch</h2>
            <div className="contact-inner">
              <p className="contact-sub">
                Whether you have an opportunity, a project idea, or just want to connect — my inbox is always open.
              </p>
              <div className="contact-links">
                <a href="https://github.com/jy-crnz" target="_blank" rel="noopener noreferrer" className="contact-button">
                  <GithubIcon size={18} /> GitHub
                </a>
                <a href="https://www.linkedin.com/in/jay-lawrence-cerniaz-78a28033b" target="_blank" rel="noopener noreferrer" className="contact-button secondary">
                  <LinkedInIcon size={18} /> LinkedIn
                </a>
                <a href="mailto:cerniazjay@gmail.com" className="contact-button secondary">
                  <Mail size={18} /> Email Me
                </a>
              </div>
            </div>
          </AnimatedSection>
        </main>

        <footer>
          <span>jy-crnz</span>
          <span>&copy; {new Date().getFullYear()} Jay Lawrence C. Cerniaz</span>
        </footer>
      </div>
    </>
  )
}