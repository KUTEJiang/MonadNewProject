import { test, expect } from '@playwright/test'

test.describe('Wallet Connection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display connect wallet button when not connected', async ({ page }) => {
    // Check that the connect wallet button is visible
    await expect(page.getByText('Connect Wallet')).toBeVisible()
  })

  test('should show wallet connector options when connect button is clicked', async ({ page }) => {
    // Click the connect wallet button
    await page.getByText('Connect Wallet').click()
    
    // Check that connector options are displayed
    await expect(page.getByText('MetaMask')).toBeVisible()
    await expect(page.getByText('WalletConnect')).toBeVisible()
    await expect(page.getByText('Injected')).toBeVisible()
    
    // Check that the Monad Testnet notice is shown
    await expect(page.getByText('Monad Testnet Required')).toBeVisible()
    await expect(page.getByText('Make sure your wallet is connected to Monad Testnet')).toBeVisible()
  })

  test('should close connector dropdown when close button is clicked', async ({ page }) => {
    // Open the connector dropdown
    await page.getByText('Connect Wallet').click()
    await expect(page.getByText('MetaMask')).toBeVisible()
    
    // Close the dropdown
    await page.getByRole('button', { name: /close/i }).click()
    
    // Check that the dropdown is closed
    await expect(page.getByText('MetaMask')).not.toBeVisible()
  })

  test('should show proper connector descriptions', async ({ page }) => {
    await page.getByText('Connect Wallet').click()
    
    // Check connector descriptions
    await expect(page.getByText('Connect using MetaMask')).toBeVisible()
    await expect(page.getByText('Scan with WalletConnect')).toBeVisible()
    await expect(page.getByText('Connect using browser wallet')).toBeVisible()
  })

  test('should handle wallet connection attempt gracefully', async ({ page }) => {
    // Mock wallet connection failure
    await page.route('**/*', route => {
      if (route.request().url().includes('wallet')) {
        route.abort()
      } else {
        route.continue()
      }
    })

    await page.getByText('Connect Wallet').click()
    
    // Try to connect with MetaMask (will fail gracefully)
    await page.getByText('MetaMask').click()
    
    // Should still show the connect button (connection failed)
    await expect(page.getByText('Connect Wallet')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that the connect wallet button is still visible and clickable
    await expect(page.getByText('Connect Wallet')).toBeVisible()
    
    await page.getByText('Connect Wallet').click()
    await expect(page.getByText('MetaMask')).toBeVisible()
  })
})