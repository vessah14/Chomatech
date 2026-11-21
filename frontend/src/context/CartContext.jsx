import { formatPrixFcfa } from '../utils/format'
import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

function readCart () {
  try {
    return JSON.parse(localStorage.getItem('chomatech-cart')) || []
  } catch {
    return []
  }
}

export function CartProvider ({ children }) {
  const [cart, setCart] = useState(readCart)

  function persist (nextCart) {
    setCart(nextCart)
    try {
      localStorage.setItem('chomatech-cart', JSON.stringify(nextCart))
    } catch {
      // Storage plein ou indisponible : on garde l'état mémoire sans casser l'expérience.
    }
  }

  function addToCart (product, quantity = 1) {
    setCart(current => {
      const existing = current.find(item => item.id === product.id)
      const nextCart = existing
        ? current.map(item =>
            item.id === product.id
              ? { ...item, ...product, quantity: item.quantity + quantity }
              : item
          )
        : [...current, { ...product, quantity }]

      try {
        localStorage.setItem('chomatech-cart', JSON.stringify(nextCart))
      } catch { /* Keep the cart in memory if browser storage is unavailable. */ }
      return nextCart
    })
  }

  function updateQuantity (id, quantity) {
    if (quantity < 1) return removeFromCart(id)
    setCart(current => {
      const nextCart = current.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
      try {
        localStorage.setItem('chomatech-cart', JSON.stringify(nextCart))
      } catch { /* Keep the cart in memory if browser storage is unavailable. */ }
      return nextCart
    })
  }

  function removeFromCart (id) {
    setCart(current => {
      const nextCart = current.filter(item => item.id !== id)
      try {
        localStorage.setItem('chomatech-cart', JSON.stringify(nextCart))
      } catch { /* Keep the cart in memory if browser storage is unavailable. */ }
      return nextCart
    })
  }

  function clearCart () {
    setCart([])
    try {
      localStorage.removeItem('chomatech-cart')
    } catch { /* Keep the cart in memory if browser storage is unavailable. */ }
  }

  // Le panier vit dans le localStorage et peut dater de plusieurs jours : prix modifié, produit
  // archivé, en rupture ou supprimé. On le recale sur le catalogue actuel AVANT la commande,
  // plutôt que de laisser le backend refuser la commande sans que le client comprenne pourquoi.
  // Renvoie la liste des changements (pour les afficher), vide si rien n'a bougé.
  function synchroniserAvecCatalogue (produits) {
    const parId = new Map(produits.map(p => [p.id, p]))
    const changements = []

    const next = cart.flatMap(item => {
      const produit = parId.get(item.id)
      if (!produit) {
        changements.push({ type: 'indisponible', nom: item.tittle })
        return [{ ...item, available: false }]
      }

      if (produit.statut !== 'Disponible' || produit.stock <= 0) {
        changements.push({ type: 'indisponible', nom: produit.nomProduit })
        return [{
          ...item,
          tittle: produit.nomProduit,
          price: Number(produit.montant),
          priceLabel: formatPrixFcfa(produit.montant),
          image: produit.image,
          type: produit.categorie,
          available: false
        }]
      }

      const quantity = Math.min(item.quantity, produit.stock)
      if (quantity !== item.quantity)
        changements.push({
          type: 'quantite',
          nom: produit.nomProduit,
          quantite: quantity
        })
      if (Number(produit.montant) !== Number(item.price))
        changements.push({ type: 'prix', nom: produit.nomProduit })

      return [
        {
          ...item,
          tittle: produit.nomProduit,
          price: Number(produit.montant),
          priceLabel: formatPrixFcfa(produit.montant),
          image: produit.image,
          type: produit.categorie,
          available: true,
          quantity
        }
      ]
    })

    if (changements.length > 0) persist(next)
    return changements
  }

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  const total = cart.reduce((sum, item) =>
    item.available === false ? sum : sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        synchroniserAvecCatalogue
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart () {
  return useContext(CartContext)
}
