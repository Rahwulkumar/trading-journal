import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Toast, ToastContainer } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function WeeklyBiasDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bias, setBias] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    const fetchBias = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/weekly-bias/${id}/`);
        setBias(response.data);
      } catch (error) {
        setToast({ show: true, message: 'Failed to load weekly bias details.', variant: 'danger' });
        navigate('/weekly-bias');
      }
    };
    fetchBias();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this weekly bias?')) {
      try {
        await axios.delete(`http://localhost:8000/weekly-bias/${id}`);
        setToast({ show: true, message: 'Weekly bias deleted successfully!', variant: 'success' });
        navigate('/weekly-bias');
      } catch (error) {
        setToast({ show: true, message: 'Failed to delete weekly bias.', variant: 'danger' });
      }
    }
  };

  if (!bias) return null;

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Weekly Bias Details</h2>
          <p className="text-muted">
            {bias.pair} ({bias.week_start_date} to {bias.week_end_date})
          </p>
        </Col>
        <Col className="text-end">
          <Button variant="outline-danger" onClick={handleDelete}>Delete Bias</Button>
        </Col>
      </Row>

      <Card className="p-4 mb-4">
        <h5 className="mb-3">Overview</h5>
        <p className="mb-2"><strong>Expecting:</strong> {bias.expecting_notes || 'N/A'}</p>
        <p className="mb-2"><strong>Not Expecting:</strong> {bias.not_expecting_notes || 'N/A'}</p>
      </Card>

      <Card className="p-4 mb-4">
        <h5 className="mb-3">Bias Points</h5>
        {bias.bias_points.length > 0 ? (
          <ul>
            {bias.bias_points.map((point, index) => (
              <li key={index} className="mb-2">
                {point.bias_type === 'expecting' ? 'Expecting' : 'Not Expecting'}: {point.point}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No bias points added.</p>
        )}
      </Card>

      <Card className="p-4 mb-4">
        <h5 className="mb-3">Screenshots</h5>
        {bias.screenshots.length > 0 ? (
          <Row>
            {bias.screenshots.map((screenshot, index) => (
              <Col md={4} key={index} className="mb-3">
                <Card className="p-2">
                  <Card.Title>{screenshot.label}</Card.Title>
                  <Card.Body>
                    <a href={screenshot.screenshot_url} target="_blank" rel="noopener noreferrer">
                      View Screenshot
                    </a>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p className="text-muted">No screenshots available.</p>
        )}
      </Card>
    </Container>
  );
}

export default WeeklyBiasDetailView;