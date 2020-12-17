import mongoose from 'mongoose'

const schema = mongoose.Schema

const portfolioSchema = new schema({
    user: {
        type: String
    },
    description: {
        type: String
    },
    socialMediaHandles: {
        type: Map,
        of: String
    },
    greetingText: {
        type: String,
        default: "Hi There!"
    },
    navColor: {
        default: "#ffff",
        type: String
    },
    font: {
        default: "Arial",
        type: String
    },
    backgroundColor: {
        default: '#ffff',
        type: String
    },
    rssFeed: {
        type: String
    },
    displayName: {
        type: String
    },
    layout: {
        default: 'Minimal',
        type: String
    },
    occupation: {
        type: String
    }
})

const Portfolio = mongoose.model('Portfolio', portfolioSchema)
export default Portfolio