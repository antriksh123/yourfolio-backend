import express from 'express'
import User from './models/User.js'
import Portfolio from './models/Portfolio.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import auth from './utils/auth.js'
import emailValidator from 'email-validator'
import passwordValidator from 'password-validator'

// Custom Specifications
// Username Schema
const usernameSchema = new passwordValidator()
usernameSchema.is().min(3).is().max(18).is().not().spaces()

// Password Schema
const passwordSchema = new passwordValidator()
passwordSchema.is().min(8).is().max(100).has().uppercase().has().lowercase().has().digits().is().not().spaces()

const router = express.Router()

// API Routes
router.post('/api/auth/signup', async (req, res) => {
    const { username, email, password, passwordConfirmation } = req.body

    // Validation: all fields are filled
    if (!username || !email || !password || !passwordConfirmation) {
        return res.status(400).json({ 
            "error": "true",
            "for": "fields",
            "msg": "fill all the fields"
        })
    }

    // Validation: username is valid
    if (usernameSchema.validate(username, { list: true }).length !== 0) {
        return res.status(400).json({ 
            "error": "true",
            "for": "username",
            "method_fail": usernameSchema.validate(username, { list: true }),
            "msg": "username is invalid"
        })
    }

    // Validation: email is valid
    if (!emailValidator.validate(email)) {
        return res.status(400).json({ 
            "error": "true",
            "for": "email",
            "msg": "email is invalid"
        })
    }

    // Validation: password is valid
    if (passwordSchema.validate(password, { list: true }).length !== 0) {
        return res.status(400).json({ 
            "error": "true",
            "for": "password",
            "method_fail": passwordSchema.validate(password, { list: true }),
            "msg": "password is invalid"
        })
    }

    // Validation: password is confirmed
    if (password !== passwordConfirmation) {
        return res.status(400).json({ 
            "error": "true",
            "for": "confirmation",
            "msg": "confirmation password needs to match password"
        })
    }

    // Check for existing user with email
    const existingUserWithEmail = await User.findOne({ email })
    if (existingUserWithEmail)
        return res.status(400).json({ "error": "true", "msg": "a user already exists with this email" })

    // Check for existing user with username
    const existingUserWithUsername = await User.findOne({ username })
    if (existingUserWithUsername)
        return res.status(400).json({ "error": "true", "msg": "a user already exists with this username" })

    // Generating salt
    const salt = bcrypt.genSalt()
    .then(salt => {
        // Hashing password with bcrypt
        const hashedPassword = bcrypt.hash(password, salt)
        .then(hash => {
            const newUser = new User({
                username,
                email,
                password: hash
            })
            // Saving the user
            newUser.save()
            .then(savedUser => {
                const newPortfolio = new Portfolio({
                    user: savedUser._id,
                    description: "",
                    socialMediaHandles: {
                        github: savedUser.username,
                        dribbble: savedUser.username,
                        twitter: savedUser.username,
                        devto: savedUser.username,
                        linkedin: savedUser.username,
                    }
                })

                // Save the portfolio
                newPortfolio.save()

                // Return the status code and the json
                return res.status(200).json({
                    savedUser
                })
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

router.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body

    // Validate
    if (!username || !password) {
        return res.status(400).json({ "error": "true", "msg": "fill all the fields", "for": "fields", })
    }

    const user = await User.findOne({ username })
    if (!user) {
        return res.status(400).json({ "error": "true", "msg": "no account is registered with this username", "for": "username" })
    }

    // Compare hashed password with plain text password
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
        return res.status(400).json({ "error": "true", "msg": "invalid credentials", "for": "password" })
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    return res.json({ token, user: { "id": user._id, "username": user.username, "email": user.email } })
})

// Delete a user and their portfolio
router.DELETE("/api/users/delete", async (req, res) => {
    auth(req, res)
    const deletedPortfolio = await Portfolio.findOneAndDelete({ user: req.user })
    const deletedUser = await User.findByIdAndDelete(req.user)
    res.json(deletedUser)
})

router.post("/api/isTokenValid", async (req, res) => {
    const token = req.headers["x-auth-token"]
    if (!token) return res.json(false)
    
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
    if (!verifiedToken) return res.json(false)
    
    const user = await User.findById(verifiedToken.id)
    if (!user) return res.json(false)

    return res.json(true)
})

// Getting one user
router.GET("/api/users/user", async (req, res) => {
    auth(req, res)
    const user = await User.findById(req.user)
    res.json({
        "username": user.username,
        "email": user.email,
        "id": user._id
    })
})

// Getting the porfolio based on username
router.GET("/api/portfolio/:username", async (req, res) => {
    const existingUser = await User.findOne({ username: req.params.username })
    
    // User exists
    if (existingUser) {
        const userPortfolio = await Portfolio.findOne({ user: existingUser._id })
        return res.status(200).json(userPortfolio)
    }
    // User does not exist
    else {
        return res.status(400).json({ "error": "true", "msg": "user does not exist" })
    }
})

// Update Portfolio info
router.post("/api/portfolio/update", async (req, res) => {
    auth(req, res)

    // Find the portfolio
    const portfolio = await Portfolio.findOne({ user: req.user })
    // Then, update the portfolio
    if (portfolio) {
        // Call the update method
        const updatedPortfolio = await portfolio.updateOne({
             user: req.user, 
             description: req.body.description, 
             socialMediaHandles: req.body.socialMediaHandles, 
             greetingText: req.body.greetingText, 
             navColor: req.body.navColor, 
             font: req.body.font, 
             backgroundColor: req.body.backgroundColor,
             rssFeed: req.body.rssFeed,
             displayName: req.body.displayName,
             layout: req.body.layout,
             occupation: req.body.occupation
            })
        return res.status(200).json(portfolio)
    }
})

export default router