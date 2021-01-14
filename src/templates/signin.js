import {React,Component} from 'react';
import { Redirect } from "react-router-dom";
import axios from 'axios';
import Cookies from 'js-cookie';
import API_URL from "../settings.js";

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';


axios.defaults.xsrfHeaderName = "X-CSRFTOKEN";
axios.defaults.xsrfCookieName = "csrftoken";

class SignIn extends Component{
    constructor(props){
        super(props);
        this.state = {
            email:'',
            password:'',
            redirect: "/",
            res: [],
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        this.setState({[event.target.name]: event.target.value});
    }

    handleSubmit(event){
        event.preventDefault();
        const headers = {"X-CSRFTOKEN": Cookies.get('csrftoken')};
        var timeCreated = Date.now();

        axios
            .post(API_URL + 'api/login',{username: this.state.email,
          password: this.state.password}, {headers: headers})
            .then(res => {
                sessionStorage.setItem('token', res.data.token);
                sessionStorage.setItem('timeCreated', timeCreated);
                window.location = "/";
            })
            .catch((error) =>  {
                if (error.response) {
                  this.setState({
                    res: error.response.status,
                    });
                }
              });
    }

    useStyles = makeStyles((theme) => ({
          paper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          avatar: {
            margin: theme.spacing(1),
            backgroundColor: theme.palette.secondary.main,
          },
          form: {
            width: '100%',
            marginTop: theme.spacing(1),
          },
          submit: {
            margin: theme.spacing(3, 0, 2),
          },
    }));



    render(){
        if(sessionStorage.getItem('token') && sessionStorage.getItem('token') !== 'null'){
            return <Redirect to={this.state.redirect} />;
        }
        return(
            <Container style={{height:"90vh"}} component="main" maxWidth="xs">
      <CssBaseline />
      <div className={this.useStyles.paper} style={{ padding:"25% 0px"}}>
        <Avatar className={this.useStyles.avatar} style={{margin:"auto"}}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" style={{textAlign:"center"}}>
          Sign in
        </Typography>
        <form className={this.useStyles.form} noValidate onSubmit={ this.handleSubmit }>
          <TextField
            onChange= {this.handleChange}
            value={this.state.email}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <TextField
            onChange= {this.handleChange}
            value={this.state.password}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={this.useStyles.submit}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="/change-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
          </Grid>
          {this.state.res == "400" ? <h5 className="alert alert-danger" role="alert">Invalid email or password. Please try again.</h5> : ""}
          {this.state.res == "500" ? <h5 className="alert alert-danger" role="alert">The server can't be reached. Please try again later or contact the server administrator.</h5> : ""}
        </form>
      </div>
    </Container>
        );
    }

}

export default SignIn
