import "./style.css";
import 'bootstrap/dist/css/bootstrap.min.css';

import { removeEntry } from "./commands";

import { useEffect, useReducer, useCallback, useMemo } from "react";
import { debounce } from "lodash";

import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Container from "react-bootstrap/Container";

import { XLg } from "react-bootstrap-icons";

import { PassEntry } from "./types";
import * as commands from "./commands";
import { usePassEntries, useWindowDimensions } from "./hooks";

interface AppState {
  entries: PassEntry[],
  filter?: string,
  selectedEntry?: PassEntry
};

const initialState: AppState = {
  entries: [],
  filter: undefined,
  selectedEntry: undefined
};

interface AppAction {
  payload: any,
  type: "SET_ENTRIES"
        | "SELECT_ENTRY"
        | "SET_FILTER"
        | "SET_ENTRY_CONTENT"
};

function appReducer(state: AppState, action: AppAction) {
  switch (action.type) {
    case "SET_ENTRIES":
        return {
          ...state,
          entries: action.payload
        };

    case "SELECT_ENTRY":
        return {
          ...state,
          selectedEntry: action.payload,
          entries: state.entries.map((entry) => {
            return {
              ...entry,
              selected: entry === action.payload
            }
          })
        }

    case "SET_FILTER":
        return {
          ...state,
          filter: action.payload
        };

    case "SET_ENTRY_CONTENT":
        return {
          ...state,
          entries: state.entries.map((entry) => {
            return {
              ...entry,
              content: entry.name === action.payload.name
                ? action.payload.content
                : entry.content
            }
          })
        };

    default:
        return state;
  }
}

function EntryItem(props: any) {
  const styles = {
    "cursor": "pointer"
  };

  return (
    <ListGroup.Item active={props.active}>
      <Row>
        <Col xs={11} sm={11} md={11} lg={11} xl={11} style={styles} onClick={props.onClick}>
          <div>
            { props.entry.name }
          </div>
        </Col>

        <Col  style={styles} onClick={props.onRemove}>
          <XLg/>
        </Col>
      </Row>
    </ListGroup.Item>
  );
}

function EntryContent(props: any) {
  if (props.entry && props.entry.name && props.entry.content) {
    return (
      <Card>
        <Card.Body>
          <Card.Title>
            { props.entry.name }
          </Card.Title>
          <Card.Text>
            { props.entry.content }
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }
  else {
    return (
      <div>
      Loading...
      </div>
    )
  }
}

function EntriesList(props: any) {
  const dimensions = useWindowDimensions();
  const [entries, setEntries] = usePassEntries(props.filter);

  const listStyle = {
    "overflowY": "scroll",
    "maxHeight": `${Math.floor(0.90 * dimensions.height)}px`
  };

  const onRemoveEntry = (entryName: string) => {
    removeEntry(entryName)
      .then(() => {
        props.selectEntry(null);
        setEntries(props.entries.filter((entry: string) => entry !== entryName));
      });
  };

  if (entries.length > 0) {
    return (
      <ListGroup style={{overflowY: "scroll", maxHeight: `${Math.floor(0.90 * dimensions.height)}px`}}>
        {
          entries.map((entry: string) => {
            return (
              <EntryItem
                    entry={entry}
                    onClick={(e: PassEntry) => props.selectEntry(entry)}
                    onRemove={() => onRemoveEntry(entry)}
                    active={entry === props.selectedEntry} />
            );
          })
        }

      </ListGroup>
    );
  }
  else {
    return (
      <div>
        No pass entries found
      </div>
    );
  }
}

function FilterInput(props: any) {
  const onChange = debounce((event) => {
    props.setFilter(event.target.value.length > 0
      ? event.target.value
      : null);

  }, 500);

  return (
    <Form className="mb-4">
      <Form.Group className="mb-3">
        <Form.Control type="text" onChange={onChange} />
      </Form.Group>
    </Form>
  );
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    commands
      .listEntries(state.filter)
      .then((entries: PassEntry[]) => dispatch({ type: "SET_ENTRIES", payload: entries}))
      .catch(console.error);
  }, [state.filter]);

  useEffect(() => {
    if (state.selectedEntry && state.selectedEntry.name != "") {
      commands
        .getEntry(state.selectedEntry.name)
        .then((content) => {
          dispatch({
            type: "SET_ENTRY_CONTENT",
            payload: {
              name: state.selectedEntry.name,
              content: content
            }
          })
        })
        .catch(console.error);
    }
  }, [state.selectedEntry]);

  const selectEntry = useCallback((entry: PassEntry) => {
    dispatch({ type: "SELECT_ENTRY", payload: entry });
  }, []);

  const setFilter = useCallback((filter: string) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  }, []);

  const getSelectedEntry = () => {
    const entries = state.entries.filter((entry_ : PassEntry) => entry_.name === state.selectedEntry.name);
    return entries.length > 0 ? entries[0] : null;
  };

  return (
    <Container fluid>
      <Row className="mt-2">
        <Col lg={4} md={3} xl={4}>
          <FilterInput setFilter={setFilter} />
          <EntriesList filter={state.filter} selectEntry={selectEntry} selectedEntry={state.selectedEntry}/>
        </Col>

        <Col>
          { state.selectedEntry ? <EntryContent entry={getSelectedEntry()}/> : null }
        </Col>
      </Row>
    </Container>
  );
}

export default App;
