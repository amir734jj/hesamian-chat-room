class Info extends React.Component {
    constructor() {
        super();
        this.state = {
            name: ""
        };
    }

    handleSubmit = submitHandler => event => {
        event.preventDefault();

        submitHandler(this.state);
    };

    render() {
        const { submitHandler } = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)}>
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="name"
                        className="form-control"
                        id="name"
                        onChange={event => this.setState({ name: event.target.value })}
                    />
                </div>
                <button type="submit" className="btn btn-default">
                    Submit
                </button>
            </form>
        );
    }
}

class Chat extends React.Component {
    constructor() {
        super();
        this.state = {
            name: "",
            messages: [],
            initialized: false
        };
    }

    componentDidMount() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chat")
            .build();

        this.connection.on("Log", (event, count) => {
            this.setState(({ messages }) => messages.unshift([event, count]));
        });

        this.connection.start();
    }

    componentWillUnmount() {
        this.connection.stop();
    }

    setInfoHandler = ({ name }) => {
        this.setState({ initialized: true, name });
    };

    render() {
        return (
            <div>
                {this.state.initialized ? (
                    <div>
                        <span className="label label-primary"> {this.state.name}</span>

                        <div className='clearfix' style={{ margin: '2rem'}}>
                            <pre>
                                {this.state.messages.map((x, i) => `Event: ${x[0]}: #${x[1]}`).join("\n")}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <Info submitHandler={this.setInfoHandler} />
                )}
            </div>
        );
    }
}

class App extends React.Component {
    render() {
        return (
            <div>
                <h3>Chat Room</h3>
                <Chat />
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById("app"));
