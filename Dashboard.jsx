import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newProject, setNewProject] = useState({ name: "", deadline: "" });
  const [newTask, setNewTask] = useState({ title: "", projectId: "", status: "Not Started", dueDate: "" });

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch {
      alert("Failed to fetch projects");
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch {
      alert("Failed to fetch tasks");
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name) return;
    try {
      const res = await api.post("/projects", newProject);
      setProjects([...projects, res.data]);
      setNewProject({ name: "", deadline: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add project");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.projectId) return;
    try {
      const res = await api.post("/tasks", newTask);
      setTasks([...tasks, res.data]);
      setNewTask({ title: "", projectId: "", status: "Not Started", dueDate: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add task");
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p._id !== id));
      setTasks(tasks.filter((t) => t.projectId !== id));
    } catch {
      alert("Failed to delete project");
    }
  };

  const markProjectComplete = async (id) => {
    try {
      const res = await api.put(`/projects/${id}`, { completed: true });
      setProjects(projects.map((p) => (p._id === id ? res.data : p)));
    } catch {
      alert("Failed to mark project complete");
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete task");
    }
  };

  const updateTaskStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/tasks/${id}`, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
    } catch {
      alert("Failed to update task status");
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedTasks = Array.from(tasks);
    const [moved] = reorderedTasks.splice(result.source.index, 1);
    reorderedTasks.splice(result.destination.index, 0, moved);
    setTasks(reorderedTasks);
  };

  const isOverdue = (date) => date && new Date(date) < new Date();

  return (
    <div className="container-fluid p-0">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 bg-dark text-white">
        <h3>Welcome, {user?.name}</h3>
        <button className="btn btn-danger" onClick={logout}>Logout</button>
      </div>

      {/* Add Project Form */}
      <div className="p-3 bg-light border-bottom">
        <form className="d-flex" onSubmit={handleAddProject}>
          <input
            type="text"
            className="form-control me-2"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <input
            type="date"
            className="form-control me-2"
            value={newProject.deadline}
            onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
          />
          <button className="btn btn-primary">Add Project</button>
        </form>
      </div>

      {/* Add Task Form */}
      <div className="p-3 bg-light border-bottom">
        <form className="d-flex" onSubmit={handleAddTask}>
          <input
            type="text"
            className="form-control me-2"
            placeholder="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <input
            type="date"
            className="form-control me-2"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
          <select
            className="form-select me-2"
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
          >
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select
            className="form-select me-2"
            value={newTask.projectId}
            onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button className="btn btn-success">Add Task</button>
        </form>
      </div>

      {/* Trello Board */}
      <div className="d-flex flex-row p-3 overflow-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {projects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project._id);
            const completed = projectTasks.filter((t) => t.status === "Completed").length;
            const progress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : 0;
            return (
              <Droppable droppableId={project._id} key={project._id}>
                {(provided) => (
                  <div
                    className="p-3 m-2 bg-light rounded shadow"
                    style={{ width: "300px", minHeight: "400px" }}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className={project.completed ? "text-decoration-line-through text-success" : ""}>
                        {project.name}
                      </h5>
                      <div>
                        {!project.completed && (
                          <button
                            className="btn btn-sm btn-outline-success me-1"
                            onClick={() => markProjectComplete(project._id)}
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteProject(project._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    {project.deadline && <p className="text-muted">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>}
                    <div className="progress mb-3">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${progress}%` }}
                        aria-valuenow={progress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {progress}%
                      </div>
                    </div>
                    {projectTasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            className="card mb-2"
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                          >
                            <div className="card-body">
                              <p className="card-text">{task.title}</p>
                              {task.dueDate && (
                                <small className={isOverdue(task.dueDate) ? "text-danger" : "text-muted"}>
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </small>
                              )}
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <select
                                  className="form-select form-select-sm"
                                  value={task.status}
                                  onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                                >
                                  <option>Not Started</option>
                                  <option>In Progress</option>
                                  <option>Completed</option>
                                </select>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteTask(task._id)}
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </DragDropContext>
      </div>
    </div>
  );
}
