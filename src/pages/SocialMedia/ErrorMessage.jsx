import React from 'react';
import PropTypes from 'prop-types';
import { FiAlertTriangle } from 'react-icons/fi';
// import './ErrorMessage.css';

const ErrorMessage = ({ message }) => (
  <div className="error-message">
    <FiAlertTriangle className="error-icon" />
    <p>{message || "Erreur lors du chargement des publications"}</p>
    <button onClick={() => window.location.reload()}>Réessayer</button>
  </div>
);

ErrorMessage.propTypes = {
  message: PropTypes.string,
};

export default ErrorMessage;