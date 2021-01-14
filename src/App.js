import React, { Component, useState } from 'react';
import { BrowserRouter, Switch, Route, Link } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Badge,
  Box,
  Hidden,
  IconButton,
  Toolbar,
  makeStyles
} from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

import MenuIcon from '@material-ui/icons/Menu';
import InputIcon from '@material-ui/icons/Input';
import SignIn from './templates/signin';
import HistoryPayments from './templates/home';
import LogOut from './templates/logout';
import ChangePassword from './templates/change-password';
import ChangePasswordConfirm from './templates/change-password-confirm';
require('dotenv').config();

const useStyles = makeStyles(() => ({
  root: {},
  avatar: {
    width: 60,
    height: 60
  }
}));



class App extends Component {
    constructor(props){
        super(props);
        this.state = {
            loggedIn: true,
        };
    }

    componentDidMount(){
    if(!sessionStorage.getItem('token') && sessionStorage.getItem('token') === null){
        this.setState({loggedIn: false})
    }
    }

  render() {
    return (
    <div className="wrapper">
        <BrowserRouter>
        {this.state.loggedIn ? (
         <nav className="navbar navbar-expand-lg navbar-light bg-light">
     <AppBar
      className={clsx(useStyles.root)}
      elevation={0}
    >
      <Toolbar>
        <Link to="/">
        </Link>
        <Box flexGrow={1} />
         <Link to="/logout">
          <IconButton color="inherit">
            <InputIcon />
          </IconButton>
          </Link>
      </Toolbar>
    </AppBar>

        </nav>
        ): null}
        <Switch>

          <Route path="/signin">
            <SignIn />
          </Route>
          <Route path="/logout">
            <LogOut />
          </Route>
            <Route path="/change-password-confirm">
            <ChangePasswordConfirm />
          </Route>
           <Route path="/change-password">
            <ChangePassword />
          </Route>
          <Route path="/">
            <HistoryPayments />
          </Route>
        </Switch>

        <Typography style={{marginTop:"30px", padding:"8px"}} variant="body2" color="textSecondary" align="center">
          {'Copyright'} {new Date().getFullYear()} {'© Developed by '}
              <Link color="inherit" href="https://mijoski.com/">
                Matej Mijoski
              </Link>
        </Typography>
      </BrowserRouter>
      </div>
    );
  }
}


export default App;