import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  Button,
  Grid,
  Typography,
  Collapse,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import axios from 'axios';
import { debounce } from 'lodash';

const PropFirmAccountForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account_name: '',
    prop_firm: '',
    capital_size: '',
    currency: 'USD',
    max_daily_drawdown: '',
    max_overall_drawdown: '',
    profit_target: '',
    min_trading_days: '',
    max_trades_per_day: '',
    evaluation_phase: 'Challenge',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [accounts, setAccounts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [sections, setSections] = useState({
    basic: true,
    risk: true,
    goals: true,
  });

  // Fetch existing accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/accounts/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAccounts(response.data);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to fetch accounts',
          severity: 'error',
        });
      }
    };
    fetchAccounts();
  }, []);

  // Debounced validation
  const validateForm = useCallback(
    debounce((data) => {
      const errors = {};
      if (!data.account_name) errors.account_name = 'Account name is required';
      if (!data.prop_firm) errors.prop_firm = 'Prop firm is required';
      if (!data.capital_size || data.capital_size <= 0) errors.capital_size = 'Capital size must be positive';
      if (!data.max_daily_drawdown || data.max_daily_drawdown <= 0)
        errors.max_daily_drawdown = 'Daily drawdown must be positive';
      if (!data.max_overall_drawdown || data.max_overall_drawdown <= 0)
        errors.max_overall_drawdown = 'Overall drawdown must be positive';
      if (!data.profit_target || data.profit_target <= 0) errors.profit_target = 'Profit target must be positive';
      if (!data.min_trading_days || data.min_trading_days < 0)
        errors.min_trading_days = 'Minimum trading days must be non-negative';
      if (data.max_trades_per_day && data.max_trades_per_day < 0)
        errors.max_trades_per_day = 'Max trades per day must be non-negative';
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }, 300),
    []
  );

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      validateForm(updated);
      return updated;
    });
  };

  // Handle section toggle
  const toggleSection = (section) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        capital_size: parseFloat(formData.capital_size),
        max_daily_drawdown: parseFloat(formData.max_daily_drawdown),
        max_overall_drawdown: parseFloat(formData.max_overall_drawdown),
        profit_target: parseFloat(formData.profit_target),
        min_trading_days: parseInt(formData.min_trading_days) || 0,
        max_trades_per_day: parseInt(formData.max_trades_per_day) || null,
      };

      if (editId) {
        await axios.put(`http://localhost:8000/accounts/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'Account updated successfully', severity: 'success' });
      } else {
        await axios.post('http://localhost:8000/accounts/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'Account added successfully', severity: 'success' });
      }

      // Reset form
      setFormData({
        account_name: '',
        prop_firm: '',
        capital_size: '',
        currency: 'USD',
        max_daily_drawdown: '',
        max_overall_drawdown: '',
        profit_target: '',
        min_trading_days: '',
        max_trades_per_day: '',
        evaluation_phase: 'Challenge',
        start_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setEditId(null);

      // Refresh accounts
      const response = await axios.get('http://localhost:8000/accounts/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(response.data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save account',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (account) => {
    setFormData({
      account_name: account.account_name,
      prop_firm: account.prop_firm,
      capital_size: account.capital_size.toString(),
      currency: account.currency,
      max_daily_drawdown: account.max_daily_drawdown.toString(),
      max_overall_drawdown: account.max_overall_drawdown.toString(),
      profit_target: account.profit_target.toString(),
      min_trading_days: account.min_trading_days.toString(),
      max_trades_per_day: account.max_trades_per_day?.toString() || '',
      evaluation_phase: account.evaluation_phase,
      start_date: account.start_date,
      notes: account.notes || '',
    });
    setEditId(account.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container sx={{ py: 4, bgcolor: 'background.default' }}>
      <Card sx={{ bgcolor: 'grey.900', color: 'white' }}>
        <CardHeader
          title="Manage Prop Firm Accounts"
          subheader="Add or update your prop firm account details"
          subheaderTypographyProps={{ color: 'grey.400' }}
        />
        <form onSubmit={handleSubmit}>
          <CardContent>
            {/* Basic Info Section */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  Basic Info
                  <IconButton onClick={() => toggleSection('basic')}>
                    {sections.basic ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Typography>
              </Grid>
              <Collapse in={sections.basic} sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ pl: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Name"
                      name="account_name"
                      value={formData.account_name}
                      onChange={handleChange}
                      error={!!formErrors.account_name}
                      helperText={formErrors.account_name}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prop Firm"
                      name="prop_firm"
                      value={formData.prop_firm}
                      onChange={handleChange}
                      error={!!formErrors.prop_firm}
                      helperText={formErrors.prop_firm}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Capital Size"
                      name="capital_size"
                      type="number"
                      value={formData.capital_size}
                      onChange={handleChange}
                      error={!!formErrors.capital_size}
                      helperText={formErrors.capital_size}
                      variant="outlined"
                      InputProps={{ endAdornment: <Typography color="grey.400">$</Typography> }}
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Select
                      fullWidth
                      label="Currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', color: 'white' }}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Select
                      fullWidth
                      label="Evaluation Phase"
                      name="evaluation_phase"
                      value={formData.evaluation_phase}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', color: 'white' }}
                    >
                      <MenuItem value="Challenge">Challenge</MenuItem>
                      <MenuItem value="Verification">Verification</MenuItem>
                      <MenuItem value="Funded">Funded</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                </Grid>
              </Collapse>

              {/* Risk Limits Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  Risk Limits
                  <IconButton onClick={() => toggleSection('risk')}>
                    {sections.risk ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Typography>
              </Grid>
              <Collapse in={sections.risk} sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ pl: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Daily Drawdown"
                      name="max_daily_drawdown"
                      type="number"
                      value={formData.max_daily_drawdown}
                      onChange={handleChange}
                      error={!!formErrors.max_daily_drawdown}
                      helperText={formErrors.max_daily_drawdown}
                      variant="outlined"
                      InputProps={{ endAdornment: <Typography color="grey.400">%</Typography> }}
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Overall Drawdown"
                      name="max_overall_drawdown"
                      type="number"
                      value={formData.max_overall_drawdown}
                      onChange={handleChange}
                      error={!!formErrors.max_overall_drawdown}
                      helperText={formErrors.max_overall_drawdown}
                      variant="outlined"
                      InputProps={{ endAdornment: <Typography color="grey.400">%</Typography> }}
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Trades Per Day"
                      name="max_trades_per_day"
                      type="number"
                      value={formData.max_trades_per_day}
                      onChange={handleChange}
                      error={!!formErrors.max_trades_per_day}
                      helperText={formErrors.max_trades_per_day}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                </Grid>
              </Collapse>

              {/* Goals Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  Goals
                  <IconButton onClick={() => toggleSection('goals')}>
                    {sections.goals ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Typography>
              </Grid>
              <Collapse in={sections.goals} sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ pl: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Profit Target"
                      name="profit_target"
                      type="number"
                      value={formData.profit_target}
                      onChange={handleChange}
                      error={!!formErrors.profit_target}
                      helperText={formErrors.profit_target}
                      variant="outlined"
                      InputProps={{ endAdornment: <Typography color="grey.400">%</Typography> }}
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Minimum Trading Days"
                      name="min_trading_days"
                      type="number"
                      value={formData.min_trading_days}
                      onChange={handleChange}
                      error={!!formErrors.min_trading_days}
                      helperText={formErrors.min_trading_days}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      name="notes"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{ bgcolor: 'grey.800', input: { color: 'white' } }}
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </CardContent>
          <CardActions sx={{ p: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading || Object.keys(formErrors).length > 0}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editId ? 'Update Account' : 'Add Account'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setFormData({
                  account_name: '',
                  prop_firm: '',
                  capital_size: '',
                  currency: 'USD',
                  max_daily_drawdown: '',
                  max_overall_drawdown: '',
                  profit_target: '',
                  min_trading_days: '',
                  max_trades_per_day: '',
                  evaluation_phase: 'Challenge',
                  start_date: new Date().toISOString().split('T')[0],
                  notes: '',
                });
                setEditId(null);
                setFormErrors({});
              }}
            >
              Reset
            </Button>
          </CardActions>
        </form>
      </Card>

      {/* Accounts Table */}
      {accounts.length > 0 && (
        <Card sx={{ mt: 4, bgcolor: 'grey.900', color: 'white' }}>
          <CardHeader title="Existing Accounts" />
          <CardContent>
            <Table sx={{ bgcolor: 'grey.800' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Prop Firm</TableCell>
                  <TableCell sx={{ color: 'white' }}>Capital</TableCell>
                  <TableCell sx={{ color: 'white' }}>Phase</TableCell>
                  <TableCell sx={{ color: 'white' }}>Start Date</TableCell>
                  <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell sx={{ color: 'white' }}>{account.account_name}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{account.prop_firm}</TableCell>
                    <TableCell sx={{ color: 'white' }}>
                      {account.capital_size.toLocaleString()} {account.currency}
                    </TableCell>
                    <TableCell sx={{ color: 'white' }}>{account.evaluation_phase}</TableCell>
                    <TableCell sx={{ color: 'white' }}>{account.start_date}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleEdit(account)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PropFirmAccountForm;