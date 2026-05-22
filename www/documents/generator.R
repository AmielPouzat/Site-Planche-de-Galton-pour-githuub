#Générateur irrationnel de nombre alétoire
library(ggplot2)
library(lawstat)
#Définition de la suite racine carré
suite <- function(u, l){
  suite=(l-1)/(u+1) +1
}

#m est la borne sup des nombres aléatoires (compris donc entre  [0, m])
#l est un entier naturel dont la racine est l'irrationnel servant à l'extraction de la suite de nombre aléatoire.
#a est cardinal du vecteur voulue de nombres alétoires.
generateur <- function(m, l, a){
  u=l**(1/2) ## On part de la limite de la suite directement (puisqu'on peut le faire)
  g=c()
  j=floor(log(m)/log(10))+1
  z=0
  
  for(i in 0:(a-1)){
    z=z+1
    
    for(k in 0:j-1){
      u=suite(u, l)
    }
    
    b=floor((u*10**(j*(z-1)+6)-floor(u*10**(j*(z-1)+6)))*10**j) #On effectue l'extraction
    
    if(b<m*floor(10**j/m)){ #On limite l'ensemble d'arriver pour avoir une répartition correct
      
      g=c(g, b%%m) #SI c'est ok, g apprend b mod(m)
      
    }
    
    else{ #sinon on regarde le nombre suivant
      i=i-1
    }
    
  }
  return(g)
}

#Exemple utilisation: generateur(15, 10, 1) donne 1 nombre "aléatoire" entre 0 et 15 avec racine de
# 10 comme limite de la suite


generator1 <- function(MAX){
  MAX= floor(MAX+sqrt(MAX)+1)#PRoblème réglé, Il y a floor(sqtr(n)+1) carré parfait entre 1 et n.
#Paramètre des toys modèles utilisés
a=16807; b=0; c=2**31-1; d=1000 #toy model de la limite == m
e=22695477; f=1; g=2**32-1; h=2**16 #Toy model du parametre de la suite == l
BORNE=2**16
test=c()
for(i in 1:MAX){
  TM2=floor( ((e*i+f)%%g+h) /2**16) ##nombre entre 1 et 2**16
  TM1=floor(((a*i+b)%%c+d)) ## nombre entre 1000 et 2**32+999
  if(TM2**(1/2)!=floor(TM2**(1/2))){ #&& testTM(a,b,c) && testTM(e,f,g))
  test=c(test, ((generateur( TM1 , TM2 , 1)**2) %%BORNE)/BORNE)}
}

#print(mean(test))
#print(var(test))
#plot(test)

return(test)

}

generator2 <- function(MAX){
  #Paramètre des toys modèles utilisés
  a=16807; b=0; c=2**31-1; d=1000 #toy model de la limite == m
  e=22695477; f=1; g=2**32-1; h=2**16 #Toy model du parametre de la suite == l
  BORNE=2**16
  test=c()
  i=0
  while(length(test)<MAX){
    i=i+1
    TM2=floor( ((e*i+f)%%g+h) /2**16) ##nombre entre 1 et 2**16
    TM1=floor(((a*i+b)%%c+d)) ## nombre entre 1000 et 2**32+999
    if(TM2**(1/2)!=floor(TM2**(1/2))){ #&& testTM(a,b,c) && testTM(e,f,g))
      test=c(test, ((generateur( TM1 , TM2 , 1)**2) %%BORNE)/BORNE)}
  }
  
  #print(mean(test))
  #print(var(test))
  #plot(test)
  
  return(test)
  
}

gen=generator1(10000)
mean(gen)
var(gen)
plot(gen)

summary(gen)
boxplot(gen)
hist(gen)
density(gen)
plot(density(gen))

qqnorm(gen,main="Generator1 - Normal Q-Q Plot")

unif <- runif(8513,min=0,max=1)
t.test(gen,unif, alternative=c("two.sided", "less", "greater"))
runs.test(gen,unif)
chisq.test(gen)
ks.test(gen,"punif") ##p-value: chance que la loi soit la loi uniforme







########################################HELL- 666#####################################################################

pgcd <- function(a,b){
  if (abs(b-0)<1e-7) {
    pgs <- a 
  }
  else {
    r <- a%%b
    pgs <- pgcd(b,r)
  }
  return(pgs)
} 

listDivPremier <- function(m){
  listDivPremier=c()
  if(m<2){
    print("Error")
  }
  else{
    
    for(i in 2:m){
      
      if(!m%%i){
        isPrem=1
        
        for(j in listDivPremier){
          if(j<i && !i%%j){
            isPrem=0
            break
          }
        }
        if(isPrem){
          listDivPremier=c(listDivPremier, i)
        }
      }
      
    }
    
  }
  return(listDivPremier)
}

#Need: pgcd(a,b), listDivremier(m)
#Return True if toy model correct for Knuth, False else
testTM <- function(m,a,b){
  prems=pgcd(b,m)-1 ## b et m sont-il premier entre eux
  testa=0 ## (a-1) est multpiple de p, entier premier diviseur de m
  lis=listDivPremier(m)
  for(p in lis[0:length(lis)-1]){
    if((a-1)%%p){
      testa=1
      break
    }
  }
  testb=0 ## (a-1) multiple de 4 si m l'est
  if(!m%%4 && (a-1)%%4){testb=1} ## si 4 divise m et 4 ne divise pas (a-1)
  return(!prems && !testa && !testb)
}

#testTM(c,a,b)
#testTM(g,e,f)

testTM(49999, 25013, 46091)

