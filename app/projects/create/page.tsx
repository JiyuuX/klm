'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [projects, setProjects] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/users/me/', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        } else {
          throw new Error('Failed to fetch user email');
        }
      } catch (error) {
        console.error('Error fetching user email:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/get-csrf-token/', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
          toast.success('CSRF token fetched successfully');
        } else {
          throw new Error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };

    fetchCsrfToken();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/user-projects/', {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        toast.success('Projects fetched successfully');
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectTitle(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !projectTitle) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectTitle', projectTitle);
    formData.append('userEmail', userEmail);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + '/api/upload/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
        },
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        console.log('File uploaded successfully');
        toast.success('File uploaded successfully');
        setFile(null); // Reset file input
        setProjectTitle(''); // Reset project title input
        await fetchProjects(); // Fetch updated projects list
      } else {
        console.error('File upload failed');
        const errorData = await response.json();
        toast.error(`File upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToProject = (project: string) => {
    router.push(`/projects/map/${encodeURIComponent(project)}`);
  };

  const handleDeleteProject = async (project: string) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/user-project/${encodeURIComponent(project)}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(`Project '${project}' deleted successfully`);
        await fetchProjects(); // Fetch updated projects list
      } else {
        const errorData = await response.json();
        toast.error(`Failed to delete project '${project}': ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error deleting project '${project}':`, error);
      toast.error(`Error deleting project '${project}'`);
    }
  };

  return (
    <div>
      <h1>Upload File</h1>
      <Toaster position='top-right' />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Project Title"
          value={projectTitle}
          onChange={handleTitleChange}
          required
        />
        <input type="file" onChange={handleFileChange} />
        <button type="submit" className="upload-button" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      <h2>My Projects</h2>
      <ul className="project-list">
        {projects.map((project, index) => (
          <li key={index} className="project-item">
            <span>{project}</span>
            <div className="project-buttons">
              <button onClick={() => handleGoToProject(project)} className="go-to-project-button">Go to Project</button>
              <button onClick={() => handleDeleteProject(project)} className="delete-button">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {loading && <div className="spinner-overlay"><div className="spinner"></div></div>}

      <style jsx>{`
        .upload-button {
          margin-top: 10px;
          padding: 8px 16px;
          background-color: ${loading ? '#ccc' : '#4CAF50'};
          color: white;
          border: none;
          cursor: ${loading ? 'not-allowed' : 'pointer'};
        }

        .go-to-project-button {
          margin-left: 10px;
          padding: 8px 16px;
          background-color: #008CBA;
          color: white;
          border: none;
          cursor: pointer;
        }

        .delete-button {
          margin-left: 10px;
          padding: 8px 16px;
          background-color: #f44336;
          color: white;
          border: none;
          cursor: pointer;
        }

        .spinner {
          border: 16px solid #f3f3f3;
          border-top: 16px solid #3498db;
          border-radius: 50%;
          width: 120px;
          height: 120px;
          animation: spin 2s linear infinite;
        }

        .spinner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinner {
          margin-top: 10px;
          font-size: 14px;
          color: #333;
        }

        .project-list {
          list-style-type: none;
          padding: 0;
        }

        .project-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .project-buttons {
          display: flex;
        }

        .project-item span {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
