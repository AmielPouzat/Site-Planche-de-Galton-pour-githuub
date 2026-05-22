polychoose <- function(xi, X){
  #return lagrange polynome on X for xi
  #Pi(xi)=1, Pi(Xj)=0, j!=i
  if(!(xi %in% X))return(0)
  nX = X[X!=xi]
  pro = prod(xi-nX)
  res <- function(x){
    pro1 = prod(x-nX)
    return(pro1/pro)
  }
  return(res)
}

polyreg <-function(tab){
  #Assume tab is a matrix n*2, where tab[1,:] = X, and tab[2:] = Y,
  #We want the polynom in Pn than P(X) = Y
  #We use the lagrange polynome
  X = tab[,1]
  Y = tab[,2]
  res <-function(x){
    s = 0
    for(i in 1:length(X)){
      tamp = polychoose(X[i], X)
      s=s+Y[i]*tamp(x)
    }
    return(s)
  }
  return(Vectorize(res))
}

F <-function(X, x, y){
  #Take X, x, y, where X is vector, x and y float
  #return Fi, y/prod(X[X!=x])
  nX = X[X!=x]
  return(y/prod(x-nX))
}

FF <-function(X, i, Y){
  return(F(X, X[i], Y[i]))
}

a <-function(X, j, i = 1){
  n = length(X)
  if(j == n)return(1)
  else{
    t = 0
    for(k in i:(j+1)){
      t = t + X[k]*a(X, j+1, k+1)
    }
    return(t)
  }
}

polyReg <- function(tab, TOTO = 1, breakO = 0){
  #Return the polynom corresponding to P(X) = Y
  #break0 is 0 for all coeff, or the number of coeff = > return (a_0, ...a_(break0-1))
  #If TOTO ==1, return the function and the coeff, else return just the coeff
  # tab = (X, Y), and we want P(X) = Y
  X = tab[,1]
  Y = tab[,2]
  coeff = c()
  n = length(X)
  if(breakO==0)breakO = n
  for(j in 0:(breakO-1)){
    tamp = 0
    for(i in 1:n){
      tamp = tamp + FF(X, i, Y)*a(X[X!=X[i]], j)
    }
    coeff = c(coeff, (-1)**(n-1-j)*tamp)
  }
  n = breakO
  
  res <-function(x){
    tamp = 0
    for(i in 1:n -1){
      tamp = tamp + x**i*coeff[i+1]
    }
    return(tamp)
  }
  if(TOTO == 1){
    return(c(Vectorize(res), coeff[n:1]))
  }
  else{
    return(coeff[n:1])
  }
}

printPoly <- function(coeff){
  #take coeff, numeric, and print the form of the polynom
  PAS = ""
  plus = ' +'
  n = length(coeff)
  for(i in 1:(n-1)){
    PAS = paste(PAS, ' ', coeff[i], 'X**', n-i, plus, sep = '')
  }
  PAS = paste(PAS, ' ', coeff[n], sep = '')
  print(PAS)
}

newPolynom <- function(coeff, sens = 1, toPrint = 1){
  #sens = 1, coeff = (a_n, a_{n-1}, ..., a_1, a_0)
  #sens = -1, coeff = (a_0, ..., a_n)
  n = length(coeff)-1
  Ind = n-0:n
  if(toPrint)printPoly(coeff)
  if(sens == 1)coeff = coeff[(n+1):1]
  res <- function(x){
    s = 0
    for(i in Ind){
      s = s + coeff[i+1]*x**i
    }
    return(s)
  }
  return(res)
}

polyModel <- function(X, Y, degree = 1, printTo = 1, Tocoeff = 0){
  #Calculate the best polynom of degree given, for P(X) = Y
  #printTo == 1 if we want print the form of the polynom, 0 else
  #Tocoeff == 1 for only the coeff of the polynom, 0 for return the polynom
  if(length(X)!=length(Y))return(0)
  else if(degree+1>length(X))degree = length(X)-1
  BUF <- function(coeff){
    BUFpoly = newPolynom(coeff, toPrint = 0)
    res = sum((BUFpoly(X) - Y)**2)
    return(res)
  }
  coeff0 = polyReg(cbind(X,Y), 0, breakO = degree+1)
  coeff0 = coeff0[(degree+1):1][(degree+1):1]#We start with the result of polyReg (but still can be rly bad with error)
  res = optim(coeff0, BUF)
  if(printTo)printPoly(res$par)
  if(Tocoeff)return(res$par)
  return(newPolynom(res$par, toPrint = 0))
}

polyCorr<-function(X, Y, degree = 1, auto = 1, LM = c(1, 1), toCoeff = 0, model = polyModel){
  #polyCorr is an ajusted correlation coeff.
  #We calculate nX = P(X), and EnX = sum(a_i*E[X**i]), with ((ai)) coeff of P
  #We can let the function calculate the coeff, just let auto == 1
  #Else, auto = 0, the coeff must be give in LM (use polyReg to get the coeff)
  #The coeff is : sum( (nX-Enx)*(Y-E[Y]))/sqrt(sum((Y-E[Y])**2)*sum( (nX-EnX)**2))
  #The coeff is in [-1, 1] and equal to 1 if Y = P(X) + Constante ( -1 for Y = -P(X) + Constante) 
  if(auto){
    BUF = model(X, Y, degree, printTo = 0, Tocoeff = 1)
    polyBUF = newPolynom(BUF, toPrint = 0)
  }
  else{
    BUF = LM
    polyBUF = newPolynom(BUF, toPrint = 0)
  }
  
  mX = 0
  for(i in 1:length(BUF)){
    mX = mX + BUF[i]*mean(X**(length(BUF)-i))
  }
  nX = polyBUF(X)-mX
  nY = Y - mean(Y)
  
  dBUF = sum( nX*Y )
  pBUF = sqrt(sum(nY**2)*sum(nX**2))
  res = dBUF/pBUF
  if(toCoeff)return(c(res, BUF))
  return(res)
}

whichPoly <- function(X, Y, seuil = 0.95, complet = 0, model = polyModel){
  #return the degree of the best polynom who have a correlation superior to the seuil.
  if(seuil==1)seuil=0.999999
  Dres = c()
  n = length(X)
  if(complet)n = complet+1
  for(i in 1:(n-1)){
    res = polyCorr(X, Y, i, toCoeff = 1, model = model)
    Dres = c(Dres, res[1])
    if(res[1]>=seuil){
      printPoly(res[2:(i+2)])
      print(paste("Corrélation : ",res[1], " ; Degré : ",i))
      if(complet)return(Dres)
      return(i)
    }
  }
  return(Dres)
}

###Example

X = runif(30, -10, 10)
coeff = c(2, -1, 4, 5)
#printPoly(coeff)
polynom = newPolynom(coeff)
Y = polynom(X)
Y = Y + rnorm(30, 0, 0.5)
degree = whichPoly(X, Y, 0.95)
#polyCorr(X, Y, degree = degree)
Res = polyModel(X, Y, degree, Tocoeff = 1)

#perfect = polyReg(cbind(X, Y))


polyModel2 <- function(X, Y, degree = 1, printTo = 1, Tocoeff = 0, seuil = 0){
  #Most powerful : let calculate on big size because polyModel is'nt optimized
  #We discretize the space, and take the mean of Y = P(X) on the good interval
  #good interval : more than 'seuil' element in the interval for X
  # We return the result of polyModel on the new X and Y
  mini = min(X)
  maxi = max(X)
  pas = min( (maxi-mini)/degree, sqrt(var(X))) #space must be cut in most than 'degree'+1 intervals
  nX = seq(mini, maxi, pas)
  check = rep(TRUE, length(nX))
  nY = c()
  for(i in 1:(length(nX))){
    C = (X>nX[i]-pas/2) & (X<=nX[i]+pas/2)
    if(sum(C) <= seuil)check[i]=FALSE
    else{
      nY = c(nY, mean(Y[C]))
    }
  }
  nX = nX[check]
  return(polyModel(nX, nY, degree, printTo, Tocoeff))
}

##Example

X = runif(1000, -1, 1)
X = sort(X)
Y = 5 - 2*exp(-X) + rnorm(1000, 0, 0.2)
X = X[Y>=0]
Y = Y[Y>=0]
Y = log(Y)
n = 8
n = whichPoly(X, Y, 0.95)
t = polyModel2(X, Y, n, Tocoeff = 1, seuil = 30)
ntest = newPolynom(t)
plot(X, Y, 'l')
lines(X, ntest(X), col = 3)
polyCorr(X, Y, auto = 0, LM = t)
polyCorr(X, Y, model = polyModel2)
# Optimization possible, and possibilyty to add the function whose discretize the space.

corre = c()
STOP = 7
for(i in 1:STOP)corre = c(corre, polyCorr(X, Y, degree = i, model = polyModel2))

plot(1:STOP, corre)

polyError <- function(X, Y,degree = 0, coeff = 0, seuil = 0.95, model = polyModel2){
  #PolyError, return the error between Pn(X) and Y
  # coeff is 0 or the coeff, start by a_n
  #seuil is for find the degree, is degree is 0, with whichPoly (CARE, can be long)
  #model is the modl to use (polyModel, polyModel2)
  if(degree == 0)degree = whichPoly(X, Y, seuil = seuil)
  if(length(coeff) == 1){
    pol = model(X, Y, degree, printTo = 0)
  }
  else if(length(coeff)>1){
    pol = newPolynom(coeff, toPrint = 0)
  }
  else{
    print("coeff need to be the ... coeff, start by a_n")
    return(0)
  }
  nY = pol(X)
  return(sqrt(sum((Y-nY)**2)))
}

#Example
X = sort(runif(50, runif(1, -5, -4), runif(1, 4, 5)))
Y = sort(runif(50, runif(1, 0, 1), runif(1, 10, 11)))

degree = whichPoly(X, Y, 0.96)
polyError(X, Y, degree)

degree = 10
pol = polyModel2(X, Y,degree = degree, Tocoeff = 1)
polyError(X, Y,degree = degree, coeff = pol)

plot(X, Y, 'l')
lines(X, newPolynom(pol)(X), lwd = 2, col = 3)

complet = 12
corrCoeff = whichPoly(X, Y,seuil = 1, complet = complet, model = polyModel2)
plot(1:complet, corrCoeff)

err = c()
for(i in 1:complet)err = c(err, polyError(X, Y, degree = i))
plot(1:complet, err)
