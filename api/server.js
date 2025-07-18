const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const COURSES_FILE = path.join(__dirname, 'courses.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));


async function readCourses() {
  try {
    const data = await fs.readFile(COURSES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading courses file:', error);
    return { courses: [] };
  }
}


async function writeCourses(coursesData) {
  try {
    await fs.writeFile(COURSES_FILE, JSON.stringify(coursesData, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing courses file:', error);
    return false;
  }
}


function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Routes


app.get('/api/courses', async (req, res) => {
  try {
    const coursesData = await readCourses();
    res.json(coursesData.courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});


app.get('/api/courses/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const coursesData = await readCourses();
    const filteredCourses = coursesData.courses.filter(course => course.page === page);
    res.json(filteredCourses);
  } catch (error) {
    console.error('Error fetching courses by page:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/courses - Add new course
app.post('/api/courses', async (req, res) => {
  try {
    const { title, category, description, imageUrl, courseUrl, page } = req.body;

    // Validação
    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const coursesData = await readCourses();
    const newCourse = {
      id: generateId(),
      title,
      category,
      description,
      imageUrl,
      courseUrl,
      page
    };

    coursesData.courses.push(newCourse);
    
    const success = await writeCourses(coursesData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save course' });
    }

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Update course
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, imageUrl, courseUrl, page } = req.body;

    // Validação
    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const coursesData = await readCourses();
    const courseIndex = coursesData.courses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = {
      id,
      title,
      category,
      description,
      imageUrl,
      courseUrl,
      page
    };

    coursesData.courses[courseIndex] = updatedCourse;
    
    const success = await writeCourses(coursesData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update course' });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Delete course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const coursesData = await readCourses();
    const courseIndex = coursesData.courses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const deletedCourse = coursesData.courses.splice(courseIndex, 1)[0];
    
    const success = await writeCourses(coursesData);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }

    res.json({ message: 'Course deleted successfully', course: deletedCourse });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server em caso de desenvolvimento
/*app.listen(PORT, () => {
  console.log(`🚀 Capacita TG API Server running on port ${PORT}`);
  console.log(`📚 Courses API available at http://localhost:${PORT}/api/courses`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
});*/

module.exports = app;