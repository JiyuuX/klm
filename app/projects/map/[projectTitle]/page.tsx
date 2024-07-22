'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Plot from 'react-plotly.js';
import { toast } from 'react-toastify';
import Plotly from 'plotly.js-dist';

// Define the type for plot data
interface PlotDataItem {
  Label: string;
  X: string;
  Y: string;
  Size: string;
  Color: string;
}

const ProjectMapPage = () => {
  const params = useParams();
  const projectTitle = decodeURIComponent(params.projectTitle as string);

  const [data, setData] = useState<PlotDataItem[]>([]);
  const [labelSize, setLabelSize] = useState(12);
  const [nodeSizeMultiplier, setNodeSizeMultiplier] = useState(1);
  const [shapeColor, setShapeColor] = useState('#FFFFFF'); // Defaulting to white
  const [shapes, setShapes] = useState<Plotly.Shape[]>([]);
  const [shapeHistory, setShapeHistory] = useState<Plotly.Shape[][]>([]);
  const [dragMode, setDragMode] = useState<'pan' | 'select'>('pan');
  const [userEmail, setUserEmail] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    const fetchUserEmail = async () => {
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

    fetchUserEmail();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/user-project-data/${encodeURIComponent(projectTitle)}/`);
        if (!response.ok) {
          throw new Error('API request failed');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error fetching data');
      }
    };

    fetchData();
  }, [projectTitle]);

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
        } else {
          throw new Error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
        toast.error('Error fetching CSRF token');
      }
    };

    fetchCsrfToken();
  }, []);

  const fetchShapes = async () => {
    try {
      const encodedProjectTitle = encodeURIComponent(projectTitle);
      const encodedUserEmail = encodeURIComponent(userEmail);
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/load-shapes/${encodedProjectTitle}/?userEmail=${encodedUserEmail}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (response.ok) {
        const shapesData = await response.json();
        setShapes(shapesData);
        toast.success("Shapes fetched successfully");
      } else {
        throw new Error('Failed to fetch shapes');
      }
    } catch (error) {
      console.error('Error fetching shapes:', error);
    }
  };

  useEffect(() => {
    fetchShapes();
  }, [projectTitle, userEmail]);

  const plotData: Plotly.Data[] = data.map(item => ({
    type: 'scatter',
    mode: 'markers+text',
    text: [item.Label],
    textposition: 'top center',
    textfont: { size: labelSize },
    x: [parseFloat(item.X)],
    y: [parseFloat(item.Y)],
    marker: {
      size: parseFloat(item.Size) * 200 * nodeSizeMultiplier,
      color: item.Color,
    },
  }));

  const layout: Partial<Plotly.Layout> = {
    showlegend: false,
    xaxis: {
      range: [0, 1],
      title: 'X Axis',
      color: 'white',
    },
    yaxis: {
      range: [0, 1],
      title: 'Y Axis',
      color: 'white',
    },
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
    plot_bgcolor: 'black',
    shapes: shapes as Plotly.Shape[],
    dragmode: dragMode,
    newshape: {
      line: {
        color: shapeColor,
        width: 2,
      },
    },
    uirevision: 'static',
  };

  const handleRelayout = (event: any) => {
    const updatedDragMode = event.dragmode || dragMode;
    setDragMode(updatedDragMode);

    if (event.shapes) {
      const updatedShapes = event.shapes;
      setShapes(updatedShapes);
      setShapeHistory([...shapeHistory, updatedShapes]);
    }
  };

  const undoLastShape = () => {
    if (shapeHistory.length > 0) {
      const newShapeHistory = shapeHistory.slice(0, -1);
      setShapes(newShapeHistory[newShapeHistory.length - 1] || []);
      setShapeHistory(newShapeHistory);
    }
  };

  useEffect(() => {
    const handleUndo = (event: any) => {
      if (event.ctrlKey && event.key === 'z') {
        undoLastShape();
      }
    };

    window.addEventListener('keydown', handleUndo);

    return () => {
      window.removeEventListener('keydown', handleUndo);
    };
  }, [shapeHistory]);

  useEffect(() => {
    const handleDelete = (event: any) => {
      if (event.key === 'Delete') {
        undoLastShape();
      }
    };

    window.addEventListener('keydown', handleDelete);

    return () => {
      window.removeEventListener('keydown', handleDelete);
    };
  }, [shapeHistory]);

  const saveShapes = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_HOST + `/api/save-shapes/${encodeURIComponent(projectTitle)}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          userEmail: userEmail,
          shapes: shapes,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Shapes saved successfully');
      } else {
        throw new Error('Failed to save shapes');
      }
    } catch (error) {
      console.error('Error saving shapes:', error);
      toast.error('Error saving shapes');
    }
  };

  return (
    <div>
      <h1>Project: {projectTitle}</h1>
      <div>
        <label>
          Label Size:
          <input
            type="range"
            min="8"
            max="24"
            value={labelSize}
            onChange={(e) => setLabelSize(parseInt(e.target.value))}
          />
        </label>
        <label>
          Node Size:
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={nodeSizeMultiplier}
            onChange={(e) => setNodeSizeMultiplier(parseFloat(e.target.value))}
          />
        </label>
        <div>
          <button onClick={saveShapes}>Save Shapes</button>
        </div>
      </div>
      <Plot
        data={plotData}
        layout={layout}
        onRelayout={handleRelayout}
      />
    </div>
  );
};

export default ProjectMapPage;
