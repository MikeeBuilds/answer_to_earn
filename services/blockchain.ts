import { store } from '@/store'
import { ethers } from 'ethers'
import { globalActions } from '@/store/globalSlices'
import address from '@/artifacts/contractAddress.json'
import abi from '@/artifacts/contracts/AnswerToEarn.sol/AnswerToEarn.json'
import { QuestionProp } from '@/utils/interfaces'

const { setWallet, setAnswers, setQuestion, setQuestions } = globalActions
const ContractAddress = address.address
const ContractAbi = abi.abi
let ethereum: any

if (typeof window !== 'undefined') {
  ethereum = (window as any).ethereum
}

const toWei = (num: number) => ethers.utils.parseEther(num.toString())
const fromWei = (num: number) => ethers.utils.formatEther(num)

const getEthereumContract = async () => {
  const accounts = await ethereum?.request?.({ method: 'eth_accounts' })
  const provider = accounts?.[0]
    ? new ethers.providers.Web3Provider(ethereum)
    : new ethers.providers.JsonRpcProvider(process.env.NEXT_APP_RPC_URL)
  const wallet = accounts?.[0] ? null : ethers.Wallet.createRandom()
  const signer = provider.getSigner(accounts?.[0] ? undefined : wallet?.address)

  const contract = new ethers.Contract(ContractAddress, ContractAbi, signer)
  return contract
}

const connectWallet = async () => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const accounts = await ethereum.request?.({ method: 'eth_requestAccounts' })
    store.dispatch(setWallet(accounts?.[0]))
  } catch (error) {
    reportError(error)
  }
}

const checkWallet = async () => {
  try {
    if (!ethereum) return reportError('Please install Metamask')
    const accounts = await ethereum.request?.({ method: 'eth_accounts' })

    // monitor chain change
    ethereum.on('chainChanged', () => {
      window.location.reload()
    })

    ethereum.on('accountsChanged', async () => {
      store.dispatch(setWallet(accounts?.[0]))
      await checkWallet()
    })

    if (accounts?.length) {
      store.dispatch(setWallet(accounts[0]))
    } else {
      store.dispatch(setWallet(''))
      reportError('Please connect wallet, no accounts found.')
    }
  } catch (error) {
    reportError(error)
  }
}

const getQuestions = async () => {
  const contract = await getEthereumContract()
  const questions = await contract.getQuestions()
  return structureQuestions(questions)
}

const loadData = async () => {
  await getQuestions()
}

const reportError = (error: any) => {
  console.log(error)
}

const structureQuestions = (questions: any[]): QuestionProp[] =>
  questions.map((question) => ({
    id: Number(question.id),
    title: question.title,
    description: question.description,
    owner: question.owner.toLowerCase(),
    winner: question.winner.toLowerCase(),
    paidout: question.paidout,
    deleted: question.deleted,
    updated: Number(question.updated),
    created: Number(question.created),
    answers: Number(question.answers),
    tags: question.tags.split(',').map((tag: string) => tag.trim()),
    prize: fromWei(question.prize),
  }))

export { connectWallet, checkWallet, loadData, getQuestions }