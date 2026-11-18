import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")
    const [ submitting, setSubmitting ] = useState(false)

    const { user, loading, handleRegister } = useAuth()

    useEffect(() => {
        if (user) {
            navigate("/")
        }
    }, [user, navigate])
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSubmitting(true)
        const success = await handleRegister({ username, email, password })
        setSubmitting(false)
        if (success) {
            navigate("/")
        } else {
            setError("Registration failed. Email or username might already be in use.")
        }
    }

    if (loading && !submitting) {
        return (<main><h1>Loading.......</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>
                {error && <p style={{ color: "#ef4444", marginBottom: "1rem", fontSize: "0.9rem" }}>{error}</p>}
                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <input
                            value={username}
                            onChange={(e) => { setUsername(e.target.value) }}
                            type="text" id="username" name='username' placeholder='Enter username' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' required />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' required />
                    </div>

                    <button className='button primary-button' disabled={submitting}>
                        {submitting ? "Registering..." : "Register"}
                    </button>

                </form>

                <p>Already have an account? <Link to={"/login"} >Login</Link> </p>
            </div>
        </main>
    )
}

export default Register