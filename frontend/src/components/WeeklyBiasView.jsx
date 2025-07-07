import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Toast, ToastContainer } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function WeeklyBiasView() {
  const [biases, setBiases] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBiases = async () => {
      try {
        const response = await axios.get('http://localhost:8000/weekly-bias/');
        setBiases(response.data);
      } catch (error) {
        setToast({ show: true, message: 'Failed to load weekly biases.', variant: 'danger' });
      }
    };
    fetchBiases();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this weekly bias?')) {
      try {
        await axios.delete(`http://localhost:8000/weekly-bias/${id}`);
        setBiases(biases.filter(bias => bias.id !== id));
        setToast({ show: true, message: 'Weekly bias deleted successfully!', variant: 'success' });
      } catch (error) {
        setToast({ show: true, message: 'Failed to delete weekly bias.', variant: 'danger' });
      }
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2>Weekly Bias</h2>
        </Col>
        <Col className="text-end">
          <Button as={Link} to="/weekly-bias/add" variant="primary">Add Weekly Bias</Button>
        </Col>
      </Row>

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

      {biases.length === 0 ? (
        <div className="text-center py-5 text-muted">No weekly biases found.</div>
      ) : (
        biases.map(bias => (
          <Card key={bias.id} className="p-3 mb-4">
            <Row className="align-items-center">
              <Col md={8}>
                <h5>{bias.pair} ({bias.week_start_date} to {bias.week_end_date})</h5>
                <p className="mb-2"><strong>Expecting:</strong> {bias.expecting_notes || 'N/A'}</p>
                <p className="mb-2"><strong>Not Expecting:</strong> {bias.not_expecting_notes || 'N/A'}</p>
                <div className="mb-2">
                  <strong>Points:</strong>
                  {bias.bias_points.length > 0 ? (
                    <ul>
                      {bias.bias_points.map((point, index) => (
                        <li key={index}>{point.bias_type === 'expecting' ? 'Expecting' : 'Not Expecting'}: {point.point}</li>
                      ))}
                    </ul>
                  ) : (
                    <span> None</span>
                  )}
                </div>
                <div className="mb-2">
                  <strong>Arguments:</strong>
                  {bias.arguments.length > 0 ? (
                    <ul>
                      {bias.arguments.map((arg, index) => (
                        <li key={index}>{arg.direction === 'bullish' ? 'Bullish' : 'Bearish'}: {arg.reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <span> None</span>
                  )}
                </div>
                {bias.screenshots.length > 0 && (
                  <div>
                    <strong>Screenshots:</strong>
                    <Row className="mt-2">
                      {bias.screenshots.map((screenshot, index) => (
                        <Col md={4} key={index} className="mb-2">
                          <a href={screenshot.screenshot_url} target="_blank" rel="noopener noreferrer">
                            {screenshot.label}
                          </a>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )}
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate(`/weekly-bias/${bias.id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(bias.id)}
                >
                  Delete
                </Button>
              </Col>
            </Row>
          </Card>
        ))
      )}
    </Container>
  );
}

export default WeeklyBiasView;