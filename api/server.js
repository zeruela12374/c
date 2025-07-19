const express = require('express');
const cors = require('cors');
const { kv } = require('@vercel/kv'); // Importa o cliente do Vercel KV

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Função para ler os cursos do Vercel KV
async function readCourses() {
  try {
    // Busca os dados da chave 'courses'. Se não existir, retorna um array vazio.
    const courses = await kv.get('courses');
    return courses || [];
  } catch (error) {
    console.error('Error reading courses from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os cursos no Vercel KV
async function writeCourses(coursesData) {
  try {
    // Salva o array completo de cursos na chave 'courses'
    await kv.set('courses', coursesData);
    return true;
  } catch (error) {
    console.error('Error writing courses to Vercel KV:', error);
    return false;
  }
}

// Função para gerar um ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}


// GET /api/courses - Pega todos os cursos
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await readCourses();
    res.json(courses);
  } catch (error) {
  {console.error('Error fetching courses:', error);}
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:page - Pega cursos por página
app.get('/api/courses/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const allCourses = await readCourses();
    const filteredCourses = allCourses.filter(course => course.page === page);
    res.json(filteredCourses);
  } catch (error)
  {  console.error('Error fetching courses by page:', error);}
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
);

// POST /api/courses - Adiciona um novo curso
app.post('/api/courses', async (req, res) => {
  try {
    const { title, category, description, imageUrl, courseUrl, page } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const newCourse = {
      id: generateId(),
      title,
      category,
      description,
      imageUrl,
      courseUrl,
      page,
      downloadUrl,
    };

    allCourses.push(newCourse);
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save course' });
    }

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Atualiza um curso
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, imageUrl, courseUrl, page, downloadUrl } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = { id, title, category, description, imageUrl, courseUrl, page, downloadUrl };
    allCourses[courseIndex] = updatedCourse;
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update course' });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Deleta um curso
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const deletedCourse = allCourses.splice(courseIndex, 1)[0];
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }

    res.json({ message: 'Course deleted successfully', course: deletedCourse });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Exporta o app para a Vercel
module.exports = app;