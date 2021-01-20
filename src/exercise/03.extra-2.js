import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'
import {useAsync} from '../utils'

const PokemonCacheContext = React.createContext()
PokemonCacheContext.displayName = 'PokemonCacheContext'

function pokemonCacheReducer(state, action) {
  switch (action.type) {
    case 'ADD_POKEMON': {
      return {...state, [action.pokemonName]: action.pokemonData}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}
function PokenmonCacheProvider(props) {
  const [cache, setCache] = React.useReducer(pokemonCacheReducer, {})
  const value = [cache, setCache]
  return <PokemonCacheContext.Provider value={value} {...props} />
}

function usePokenmonCache() {
  const context = React.useContext(PokemonCacheContext)
  if (!context) {
    throw new Error(`usePokemonCache must be used inside PokemonCacheProvider`)
  }
  const [cache, dispatch] = context
  const cachePokemon = React.useCallback(
    conf => {
      const {pokemonName, pokemonData} = conf
      dispatch({
        type: 'ADD_POKEMON',
        pokemonData,
        pokemonName,
      })
    },
    [dispatch],
  )
  return {cache, cachePokemon}
}

function PokemonInfo({pokemonName}) {
  const {cache, cachePokemon} = usePokenmonCache()
  const {data: pokemon, status, error, run, setData} = useAsync()

  React.useEffect(() => {
    if (!pokemonName) return
    else if (cache[pokemonName]) {
      return setData(cache[pokemonName])
    } else {
      const promise = fetchPokemon(pokemonName).then(data => {
        cachePokemon({pokemonName, pokemonData: data})
        return data
      })
      run(promise)
    }
  }, [pokemonName, run, setData, cachePokemon, cache])

  if (status === 'idle') {
    return 'Submit a pokemon'
  } else if (status === 'pending') {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === 'rejected') {
    throw error
  } else if (status === 'resolved') {
    return <PokemonDataView pokemon={pokemon} />
  }
}

function PreviousPokemon({onSelect}) {
  const {cache} = usePokenmonCache()
  return (
    <div>
      Previous Pokemon
      <ul style={{listStyle: 'none', paddingLeft: 0}}>
        {Object.keys(cache).map(pokemonName => (
          <li key={pokemonName} style={{margin: '4px auto'}}>
            <button
              style={{width: '100%'}}
              onClick={() => onSelect(pokemonName)}
            >
              {pokemonName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PokemonSection({onSelect, pokemonName}) {
  return (
    <div style={{display: 'flex'}}>
      <PokenmonCacheProvider>
        <PreviousPokemon onSelect={onSelect} />
        <div className="pokemon-info" style={{marginLeft: 10}}>
          <PokemonErrorBoundary
            onReset={() => onSelect('')}
            resetKeys={[pokemonName]}
          >
            <PokemonInfo pokemonName={pokemonName} />
          </PokemonErrorBoundary>
        </div>
      </PokenmonCacheProvider>
    </div>
  )
}

function App() {
  const [pokemonName, setPokemonName] = React.useState(null)

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleSelect(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  return (
    <div className="pokemon-info-app">
      <>
        <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
        <hr />
        <PokemonSection onSelect={handleSelect} pokemonName={pokemonName} />
      </>
    </div>
  )
}

export default App
