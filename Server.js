const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://127.0.0.1:27017/libraryDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.log("❌ Database connection error:", err));

//schemmas
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const bookSchema = new mongoose.Schema({
    bookName:  { type: String, unique: true, trim: true }, 
    authorName: { type: String, trim: true },
    bookInfo: { type: String, trim: true }
});

const assignmentSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Book = mongoose.model('Book', bookSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);

//routes
//login R
app.post('/login', (req, res) => {
    const newUser = new User(req.body);
    newUser.save()
    .then(() => res.send("Login successful"))
    .catch(err => res.status(400).send("Error: " + err.message));
});

//book add R
app.post('/addBook', async(req, res) => {
    try{
        const { bookName, authorName, bookInfo } = req.body;

        const trimmedBookName = bookName.trim();
        const trimmedAuthorName = authorName.trim();
        const trimmedBookInfo = bookInfo.trim();

        //check kerna book exist kerti ha ya ni
        const existingBook = await Book.findOne({ bookName:trimmedBookName});
        if (existingBook){
            return res.status(400).send("book already existed");
        }

        const newBook = new Book({
            bookName: trimmedBookName,
            authorName: trimmedAuthorName,
            bookInfo: trimmedBookInfo
        });

        await newBook.save();
        res.send("Book added successfully")
     }catch(err){ 
      res.status(400).send("Error: " + err.message);
     }
});

//assign book R
app.post('/assignBook', async(req, res) => {
    try{
        const {bookId, userId} = req.body;
        console.log("Request Body:", req.body);

        const existingAssignment = await Assignment.findOne({bookId, userId});
        if(existingAssignment)
            return res.status(400).send("this book already assigned to the user");

        const  newAssignment = new Assignment({
            bookId,
            userId
        });
        await newAssignment.save();
        res.send("Book assigned succesfully");
    }catch(err){     
    res.status(400).send("Error: " + err.message);
    }
});

//get book R
app.get('/getBooks', (req, res) => {
    Book.find({})
    .then(books => res.json(books))
    .catch(err => res.status(400).send("Error: " + err.message));
});

//getassignbook R
app.get('/getAssignedBooks', (req, res) => {
    Assignment.find({})
    .populate('bookId', 'bookName')
    .populate('userId', 'name')
    .then(assignments => res.json(assignments))
    .catch(err => res.status(400).send("Error: " + err.message));
});

//get user R
app.get('/getUsers', (req, res) => {
    User.find({})
    .then(users => res.json(users))
    .catch(err => res.status(400).send("Error: " + err.message));
});

//unassign book R
app.delete('/unassignBook/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send("Invalid ID format");
        }

        const result = await Assignment.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).send("Assignment not found");
        }

        res.send("Book unassigned successfully");
    } catch (err) {
        console.error("Unassignment error:", err);
        res.status(400).send("Error: " + err.message);
    }
});

app.listen(3000, () =>
     console.log('🚀 Server running on port 3000'));