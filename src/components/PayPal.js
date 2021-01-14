import React from "react";
import ReactDOM from "react-dom";
import scriptLoader from "react-async-script-loader";
import API_URL from "../settings.js";

import {FormControl, InputLabel, OutlinedInput, InputAdornment, Container, Grid, Typography} from '@material-ui/core';
import axios from 'axios';
import Cookies from 'js-cookie';
import { makeStyles } from '@material-ui/core/styles';

let PayPalButton = null;

class PaypalButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showButtons: false,
      loading: true,
      paid: false,
      amount: '0',
    };

    window.React = React;
    window.ReactDOM = ReactDOM;
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    const { isScriptLoaded, isScriptLoadSucceed } = this.props;

    if (isScriptLoaded && isScriptLoadSucceed) {
      PayPalButton = window.paypal.Buttons.driver("react", { React, ReactDOM });
      this.setState({ loading: false, showButtons: true });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { isScriptLoaded, isScriptLoadSucceed } = nextProps;

    const scriptJustLoaded =
      !this.state.showButtons && !this.props.isScriptLoaded && isScriptLoaded;

    if (scriptJustLoaded) {
      if (isScriptLoadSucceed) {
        PayPalButton = window.paypal.Buttons.driver("react", {
          React,
          ReactDOM
        });
        this.setState({ loading: false, showButtons: true });
      }
    }
  }
  createOrder = (data, actions, amount) => {
      if(this.state.amount){
        return actions.order.create({
          purchase_units: [
            {
              description: "Payment for POD",
              amount: {
                currency_code: "USD",
                value: this.refs.paypal.value,
              }
            }
          ]
        });
        }
  };

  onApprove = (data, actions) => {
        const headers = {"Authorization": "Token " + sessionStorage.getItem('token')};
        axios
         .post( API_URL + 'api/', { orderID: data.orderID }, {headers: headers});
  };

    onChange(event){
        this.setState({ amount: event.target.value });
    }


  useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: "20px auto",
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
  root1: {
    flexGrow: 1,
  },
  paper: {
    height: 140,
    width: 100,
  },
  control: {
    padding: theme.spacing(2),
  },
}));



  render() {
    const { showButtons, loading, paid, amount } = this.state;
    var className = "";
    if(amount<=0){
        className="validate"
    }
    return (
        <Grid item xs={12} lg={12} sm={12} >
            <Grid container justify="center" spacing={5}>
               <Container maxWidth="sm">
                      <Typography
              color="textSecondary"
              gutterBottom
              variant="h6"
            >
              Enter amount:
            </Typography>
                  <div className="input-group mb-3">
                      <div className="input-group-prepend">
                        <span className="input-group-text">$</span>
                      </div>
                      <input type="number" ref="paypal" name="amount" onChange={this.onChange} className="form-control" />
                  </div>
                     {showButtons && (
                      <div className={className}>
                        <PayPalButton
                          createOrder={(data, actions, amount) => this.createOrder(data, actions, amount)}
                          onApprove={(data, actions) => this.onApprove(data, actions)}
                        />
                      </div>
                        )}
                    </Container>
                </Grid>
            </Grid>
    );
  }
}

export default scriptLoader("https://www.paypal.com/sdk/js?client-id=AX7mkMXJdVtrtrmhLR75Utm2_7M4HQmlr_sY2gEu5rFyJGkHBZBkmD9cNXElFv4COnre6f1jCIQ1ztY-&disable-funding=credit&currency=USD")(PaypalButton);