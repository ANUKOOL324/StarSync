import { AxiosError } from 'axios'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthFormField } from '../components/AuthFormField'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

type FormErrors = {
  email?: string
  password?: string
  root?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const nextErrors: FormErrors = {}

    if (!email.includes('@')) nextErrors.email = 'Enter a valid email.'
    if (!password) nextErrors.password = 'Password is required.'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message ?? 'Login failed.'
          : 'Login failed.'
      setErrors({ root: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-md rounded-xl bg-linear-to-b from-[#5A5A5C]/80 via-white/15 to-[#28282A]/85 p-[2px] shadow-2xl shadow-black/45"
    >
      <div className="rounded-[10px] bg-black/58 p-6 backdrop-blur-2xl">
        <p className="auth-kicker">Welcome back</p>
        <h1 className="auth-title mt-3">Log in</h1>
        <p className="auth-copy mt-2">Continue to your chat dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
          <AuthFormField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email}
          />
          <AuthFormField
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Your password"
            error={errors.password}
          />
          {errors.root ? <p className="text-sm text-red-300">{errors.root}</p> : null}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="ghost"
            className="landing-nav-button h-11 w-full rounded-full border-2 border-white/10 bg-transparent px-7 text-white shadow-none transition-all duration-300 hover:border-white/22 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed"
          >
            <LogIn size={17} aria-hidden="true" />
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        <p className="auth-copy mt-5">
          New here?{' '}
          <Link className="auth-link hover:text-white" to="/signup">
            Create account
          </Link>
        </p>
      </div>
    </motion.section>
  )
}

